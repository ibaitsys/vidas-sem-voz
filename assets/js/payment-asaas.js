// Global configuration for Asaas
let asaasConfig = window.ASAAS_CONFIG || {
    apiKey: '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNlY2MyOGZjLTg0OTgtNDNhMC04NGI2LTkyMzFiMDMwNzg1NDo6JGFhY2hfMGY1MDhjYWYtODdmMC00OTE4LWFmN2UtNTlkMjFlYTUwMGFm',
    apiUrl: 'https://sandbox.asaas.com/api/v3',
    environment: 'sandbox'
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validation
    initFormValidation();
    
    // Initialize amount selection
    initAmountSelection();
    
    // Format inputs
    document.getElementById('cpf').addEventListener('input', formatCPF);
    document.getElementById('phone').addEventListener('input', formatPhone);
    
    // Handle form submission
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

/**
 * Handle form submission for Asaas payment
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    
    try {
        // Validate form
        if (!validateForm()) {
            throw new Error('Por favor, preencha todos os campos obrigatórios corretamente.');
        }
        
        // Get form data
        const formData = getFormData();
        
        // Process PIX payment
        const result = await processPayment(formData);
        
        // Handle success
        await handlePaymentSuccess(result);
        
    } catch (error) {
        // Handle error
        handlePaymentError(error);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

/**
 * Process payment
 * @param {Object} formData - Formatted payment data
 */
async function processPayment(formData) {
    try {
        return await processPixPayment(formData);
    } catch (error) {
        console.error('Payment processing error:', error);
        throw error;
    }
}

/**
 * Get form data as an object
 */
function getFormData() {
    const amount = document.querySelector('input[name="amount"]:checked').value;
    const customAmount = document.getElementById('customAmount').value;
    const finalAmount = customAmount || amount;
    
    const customer = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cpfCnpj: document.getElementById('cpf').value.replace(/\D/g, ''),
        mobilePhone: document.getElementById('phone').value.replace(/\D/g, '')
    };
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
    
    return {
        customer,
        billingType: 'PIX',
        value: parseFloat(finalAmount),
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Doação para Vidas Sem Voz`,
        externalReference: `donation-${Date.now()}`,
    };
}

/**
 * Process PIX payment with Asaas
 * @param {Object} paymentData - Formatted payment data
 */
async function processPixPayment(paymentData) {
    try {
        // Create or get customer
        const customer = await createCustomer(paymentData.customer);
        
        // Create PIX payment
        const payment = await createPayment({
            ...paymentData,
            customer: customer.id,
            billingType: 'PIX'
        });
        
        return {
            success: true,
            paymentId: payment.id,
            paymentMethod: 'pix',
            amount: payment.value,
            status: payment.status,
            pixQrCode: payment.encodedImage,
            pixPayload: payment.payload,
            pixExpirationDate: payment.expirationDate,
            receiptUrl: payment.invoiceUrl || ''
        };
    } catch (error) {
        console.error('PIX payment error:', error);
        throw new Error('Erro ao gerar o código PIX. Por favor, tente novamente.');
    }
}

/**
 * Create or get customer in Asaas
 * @param {Object} customerData - Customer data
 */
async function createCustomer(customerData) {
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': asaasConfig.apiKey
            },
            body: JSON.stringify(customerData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.errors ? error.errors[0].description : 'Erro ao criar cliente');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Error creating customer:', error);
        throw new Error('Erro ao processar os dados do cliente. Por favor, verifique as informações e tente novamente.');
    }
}

/**
 * Create payment in Asaas
 * @param {Object} paymentData - Payment data
 */
async function createPayment(paymentData) {
    try {
        const response = await fetch(asaasConfig.apiUrl + '/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': asaasConfig.apiKey
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao processar o pagamento');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error('Erro ao processar o pagamento. Por favor, tente novamente.');
    }
}

/**
 * Handle successful payment
 * @param {Object} result - Payment result
 */
async function handlePaymentSuccess(result) {
    // Redirect to thank you page with payment details
    const params = new URLSearchParams({
        payment_id: result.paymentId,
        amount: result.amount,
        status: result.status,
        method: result.paymentMethod
    });
    
    if (result.receiptUrl) params.append('receipt_url', result.receiptUrl);
    if (result.pixQrCode) params.append('pix_qr_code', result.pixQrCode);
    if (result.pixPayload) params.append('pix_payload', result.pixPayload);
    
    window.location.href = `/obrigado.html?${params.toString()}`;
}

/**
 * Format CPF
 */
function formatCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) {
        value = value.substring(0, 3) + '.' + value.substring(3);
    }
    if (value.length > 7) {
        value = value.substring(0, 7) + '.' + value.substring(7);
    }
    if (value.length > 11) {
        value = value.substring(0, 11) + '-' + value.substring(11, 13);
    }
    e.target.value = value;
}

/**
 * Format phone number
 */
function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = '(' + value;
    }
    if (value.length > 3) {
        value = value.substring(0, 3) + ') ' + value.substring(3);
    }
    if (value.length > 10) {
        value = value.substring(0, 10) + '-' + value.substring(10, 15);
    }
    e.target.value = value;
}

/**
 * Initialize amount selection
 */
function initAmountSelection() {
    const customAmountInput = document.getElementById('customAmount');
    const amountRadios = document.querySelectorAll('input[type="radio"][name="amount"]');

    // Handle custom amount input
    customAmountInput.addEventListener('input', function() {
        if (this.value) {
            document.getElementById('customAmountRadio').checked = true;
        }
    });

    // Handle radio button selection
    amountRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.id !== 'customAmountRadio') {
                customAmountInput.value = '';
            }
        });
    });
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    const form = document.getElementById('donationForm');
    if (!form) return;

    // Add input event listeners for real-time validation
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', () => clearError(input));
    });
}

/**
 * Validate form
 */
function validateForm() {
    const form = document.getElementById('donationForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Check required fields
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showError(`O campo ${field.getAttribute('name')} é obrigatório`);
            isValid = false;
            return false;
        }
    });
    
    // Validate email
    const email = form.querySelector('[type="email"]');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showError('Por favor, insira um e-mail válido');
        isValid = false;
    }
    
    // Validate CPF
    const cpf = form.querySelector('[name="cpf"]');
    if (cpf && cpf.value.replace(/\D/g, '').length !== 11) {
        showError('Por favor, insira um CPF válido');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert before the form
    const form = document.getElementById('donationForm');
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
    } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
