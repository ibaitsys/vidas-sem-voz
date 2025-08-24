// server/paymentHandler.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const pagarme = require('pagarme');

// Initialize Pagar.me client
const initializePagarMe = async () => {
  return await pagarme.client.connect({
    api_key: process.env.PAGARME_API_KEY,
    encryption_key: process.env.PAGARME_ENCRYPTION_KEY
  });
};

// Helper function to handle API errors
const handleApiError = (res, error) => {
  console.error('Pagar.me API Error:', error.response ? error.response.errors : error);
  const status = error.response ? error.response.status : 500;
  const message = error.response ? 
    (error.response.errors || error.response.message || 'Erro na transação') : 
    'Erro ao processar o pagamento';
  
  res.status(status < 500 ? status : 500).json({
    error: true,
    status: status,
    message: message,
    details: error.response ? error.response.errors : error.message
  });
};

// Create a transaction
router.post('/create-transaction', async (req, res) => {
  try {
    const transactionData = req.body;
    
    // Basic validation
    if (!transactionData.amount || transactionData.amount < 100) { // Minimum R$1.00
      return res.status(400).json({
        error: true,
        message: 'O valor da doação deve ser de no mínimo R$ 1,00'
      });
    }

    if (!transactionData.payment_method) {
      return res.status(400).json({
        error: true,
        message: 'Método de pagamento não especificado'
      });
    }

    const client = await initializePagarMe();
    
    // Prepare transaction data
    const transaction = {
      amount: transactionData.amount,
      payment_method: transactionData.payment_method,
      installments: transactionData.installments || 1,
      customer: transactionData.customer,
      billing: transactionData.billing,
      items: transactionData.items,
      metadata: {
        platform: 'vidas-sem-voz',
        transaction_type: 'donation',
        source: 'website'
      },
      async: false // Wait for the transaction to be processed
    };

    // Add payment method specific data
    if (transactionData.payment_method === 'credit_card') {
      if (!transactionData.card_hash) {
        return res.status(400).json({
          error: true,
          message: 'Dados do cartão inválidos'
        });
      }
      transaction.card_hash = transactionData.card_hash;
      
      // Add soft descriptor (appears on credit card statement)
      transaction.soft_descriptor = 'VIDASSEMVOZ*DOACAO';
      
    } else if (transactionData.payment_method === 'boleto') {
      // Configure boleto specific settings
      transaction.boleto_instructions = 'Pague até o vencimento';
      transaction.boleto_expiration_date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
    } else if (transactionData.payment_method === 'pix') {
      // Configure PIX specific settings
      transaction.payment = {
        pix: {
          expires_in: 3600 // 1 hour
        }
      };
    }

    // Create the transaction
    const result = await client.transactions.create(transaction);
    
    // Format the response based on payment method
    const response = {
      success: true,
      transaction_id: result.id,
      status: result.status,
      payment_method: result.payment_method,
      amount: result.amount / 100, // Convert back to reais
      authorization_code: result.acquirer_response_code,
      payment_url: result.boleto_url || result.pix_qr_code,
      barcode: result.boleto_barcode,
      due_date: result.boleto_expiration_date
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const { event, transaction } = req.body;
    
    if (!transaction || !transaction.id) {
      console.error('Invalid webhook payload:', req.body);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    console.log(`Processing webhook event: ${event} for transaction ${transaction.id}`);
    
    // Handle different webhook events
    switch (event) {
      case 'transaction_status_changed':
        await handleTransactionStatusChange(transaction);
        break;
        
      case 'subscription_created':
        await handleSubscriptionCreated(transaction);
        break;
        
      case 'subscription_canceled':
        await handleSubscriptionCanceled(transaction);
        break;
        
      case 'subscription_updated':
        await handleSubscriptionUpdated(transaction);
        break;
        
      case 'chargeback_created':
        await handleChargeback(transaction, 'created');
        break;
        
      case 'chargeback_updated':
        await handleChargeback(transaction, 'updated');
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Handle transaction status changes
async function handleTransactionStatusChange(transaction) {
  const { id, status, payment_method, amount, customer } = transaction;
  
  console.log(`Transaction ${id} changed to status: ${status}`);
  
  // Update your database with the new status
  try {
    // Here you would typically update your database
    // For example:
    // await Donation.updateOne(
    //   { transactionId: id },
    //   { 
    //     status: status,
    //     paymentMethod: payment_method,
    //     amount: amount / 100, // Convert from cents to reais
    //     updatedAt: new Date()
    //   }
    // );
    
    // Send email notifications based on status
    switch (status) {
      case 'paid':
        await sendDonationConfirmation(customer, transaction);
        break;
        
      case 'refunded':
        await sendRefundNotification(customer, transaction);
        break;
        
      case 'refused':
        await sendPaymentFailedNotification(customer, transaction);
        break;
        
      case 'processing':
        // Handle processing state
        break;
        
      case 'authorized':
        // Handle authorized state
        break;
        
      case 'pending_refund':
        // Handle pending refund
        break;
    }
    
    console.log(`Successfully processed status change for transaction ${id}`);
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    // Consider implementing retry logic for failed webhook processing
  }
}

// Handle subscription created event
async function handleSubscriptionCreated(subscription) {
  const { id, status, plan_id, current_transaction } = subscription;
  
  console.log(`New subscription created: ${id} for plan ${plan_id}`);
  
  // Update your database with the new subscription
  try {
    // Example:
    // await Subscription.create({
    //   subscriptionId: id,
    //   planId: plan_id,
    //   status: status,
    //   transactionId: current_transaction?.id,
    //   customer: current_transaction?.customer,
    //   amount: current_transaction?.amount ? current_transaction.amount / 100 : 0,
    //   paymentMethod: current_transaction?.payment_method,
    //   startDate: new Date(),
    //   nextBillingDate: new Date(subscription.current_period_end * 1000)
    // });
    
    // Send welcome email or other notifications
    if (current_transaction?.customer?.email) {
      await sendSubscriptionConfirmation(current_transaction.customer, subscription);
    }
    
    console.log(`Successfully processed new subscription ${id}`);
  } catch (error) {
    console.error(`Error processing subscription ${id}:`, error);
  }
}

// Handle subscription canceled event
async function handleSubscriptionCanceled(subscription) {
  const { id } = subscription;
  
  console.log(`Subscription canceled: ${id}`);
  
  try {
    // Update subscription status in your database
    // await Subscription.updateOne(
    //   { subscriptionId: id },
    //   { 
    //     status: 'canceled',
    //     canceledAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // );
    
    // Send cancellation confirmation
    if (subscription.current_transaction?.customer?.email) {
      await sendSubscriptionCanceledNotification(subscription.current_transaction.customer, subscription);
    }
    
    console.log(`Successfully processed cancellation for subscription ${id}`);
  } catch (error) {
    console.error(`Error processing subscription cancellation ${id}:`, error);
  }
}

// Handle subscription updated event
async function handleSubscriptionUpdated(subscription) {
  const { id, status, current_transaction } = subscription;
  
  console.log(`Subscription updated: ${id} with status ${status}`);
  
  try {
    // Update subscription in your database
    // const updateData = {
    //   status: status,
    //   updatedAt: new Date()
    // };
    
    // if (current_transaction) {
    //   updateData.lastPaymentDate = new Date();
    //   updateData.nextBillingDate = new Date(subscription.current_period_end * 1000);
    //   updateData.transactionId = current_transaction.id;
    // }
    
    // await Subscription.updateOne(
    //   { subscriptionId: id },
    //   updateData
    // );
    
    // Send update notification if needed
    if (current_transaction?.customer?.email) {
      await sendSubscriptionUpdatedNotification(current_transaction.customer, subscription);
    }
    
    console.log(`Successfully processed update for subscription ${id}`);
  } catch (error) {
    console.error(`Error processing subscription update ${id}:`, error);
  }
}

// Handle chargeback events
async function handleChargeback(transaction, eventType) {
  const { id, status, amount, chargeback } = transaction;
  
  console.log(`Chargeback ${eventType} for transaction ${id} with status: ${status}`);
  
  try {
    // Update transaction with chargeback information
    // await Donation.updateOne(
    //   { transactionId: id },
    //   { 
    //     chargebackStatus: status,
    //     chargebackReason: chargeback?.reason,
    //     chargebackAmount: amount / 100,
    //     updatedAt: new Date()
    //   }
    // );
    
    // Notify admin about the chargeback
    await notifyAdminAboutChargeback(transaction, eventType);
    
    console.log(`Successfully processed chargeback for transaction ${id}`);
  } catch (error) {
    console.error(`Error processing chargeback for transaction ${id}:`, error);
  }
}

// Helper function to send donation confirmation email
async function sendDonationConfirmation(customer, transaction) {
  // Implement your email sending logic here
  console.log(`Sending donation confirmation to ${customer.email}`);
  // Example using a mail service:
  // await mailService.send({
  //   to: customer.email,
  //   subject: 'Obrigado pela sua doação!',
  //   template: 'donation-confirmation',
  //   context: {
  //     name: customer.name,
  //     amount: (transaction.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  //     transactionId: transaction.id,
  //     paymentMethod: transaction.payment_method,
  //     date: new Date().toLocaleDateString('pt-BR')
  //   }
  // });
}

// Add other notification functions (sendRefundNotification, sendPaymentFailedNotification, etc.)
// These would follow a similar pattern to sendDonationConfirmation

module.exports = router;
