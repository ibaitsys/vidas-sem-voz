// Payment Form Handler for Vidas Sem Voz
// Using Asaas Payment API

// Global variables
let currentAmount = 0;

// Form validation state
const formState = {
    cardNumber: { valid: false, message: '' },
    cardHolderName: { valid: false, message: '' },
    cardExpiry: { valid: false, message: '' },
    cardCvv: { valid: false, message: '' },
    cardCpf: { valid: false, message: '' },
    holderBirthDate: { valid: false, message: '' }
};

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        initAmountSelection();
        initPaymentMethodTabs();
        initFormValidation();
        
        // Add form submit handler
        donationForm.addEventListener('submit', handleFormSubmit);
        
        // Initialize card number formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', formatCardNumber);
        }
        
        // Initialize card expiry formatting
        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', formatCardExpiry);
        }
        
        // Initialize CPF formatting
        const cpfInput = document.getElementById('cardCpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', formatCPF);
        }
    }
});

/**
 * Format card number with spaces
 * @param {Event} e - Input event
 */
function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    e.target.value = value;
    
    // Validate card number (basic validation)
    const isValid = value.replace(/\s/g, '').length >= 13;
    formState.cardNumber = {
        valid: isValid,
        message: isValid ? '' : 'Número do cartão inválido'
    };
    updateFieldValidation('cardNumber', isValid, formState.cardNumber.message);
}

/**
 * Format card expiry date
 * @param {Event} e - Input event
 */
function formatCardExpiry(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    
    // Validate expiry date (MM/YY format)
    const [month, year] = value.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (month && year) {
        const expiryYear = parseInt('20' + year, 10);
        const expiryMonth = parseInt(month, 10);
        
        formState.cardExpiry.valid = 
            expiryMonth >= 1 && 
            expiryMonth <= 12 && 
            (expiryYear > currentDate.getFullYear() || 
            (expiryYear === currentDate.getFullYear() && expiryMonth >= currentMonth));
            
        formState.cardExpiry.message = formState.cardExpiry.valid ? '' : 'Data de validade inválida';
        updateFieldValidation('cardExpiry', formState.cardExpiry.valid, formState.cardExpiry.message);
    }
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
    
    // Validate CPF
    formState.cardCpf.valid = validateCPF(value);
    formState.cardCpf.message = formState.cardCpf.valid ? '' : 'CPF inválido';
    updateFieldValidation('cardCpf', formState.cardCpf.valid, formState.cardCpf.message);
}

/**
 * Validate CPF
 */
function validateCPF(cpf) {
    cpf = cpf.replace(/[\D]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validate check digits
    for (let t = 9; t < 11; t++) {
        let d = 0;
        for (let c = 0; c < t; c++) {
            d += cpf.charAt(c) * ((t + 1) - c);
        }
        d = ((10 * d) % 11) % 10;
        if (parseInt(cpf.charAt(t), 10) !== d) return false;
    }
    return true;
}

function initFormValidation(form) {
    // Card number validation
    const cardNumber = form.querySelector('#cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            formState.cardNumber.valid = value.length >= 13 && value.length <= 19;
            formState.cardNumber.message = formState.cardNumber.valid ? '' : 'Número do cartão inválido';
            updateFieldValidation('cardNumber', formState.cardNumber.valid, formState.cardNumber.message);
        });
    }

    // Card name validation
    const cardName = form.querySelector('#cardName');
    if (cardName) {
        cardName.addEventListener('input', (e) => {
            formState.cardName.valid = e.target.value.trim().length > 5;
            formState.cardName.message = formState.cardName.valid ? '' : 'Nome inválido';
            updateFieldValidation('cardName', formState.cardName.valid, formState.cardName.message);
        });
    }

    // Card expiry validation
    const cardExpiry = form.querySelector('#cardExpiry');
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            formState.cardExpiry.valid = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(e.target.value);
            formState.cardExpiry.message = formState.cardExpiry.valid ? '' : 'Data inválida';
            updateFieldValidation('cardExpiry', formState.cardExpiry.valid, formState.cardExpiry.message);
        });
    }

    // CVV validation
    const cardCvv = form.querySelector('#cardCvv');
    if (cardCvv) {
        cardCvv.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value.substring(0, 4);
            formState.cardCvv.valid = value.length >= 3 && value.length <= 4;
            formState.cardCvv.message = formState.cardCvv.valid ? '' : 'CVV inválido';
            updateFieldValidation('cardCvv', formState.cardCvv.valid, formState.cardCvv.message);
        });
    }
}

function updateFieldValidation(fieldId, isValid, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorElement = field.parentElement?.querySelector('.error-message');
    
    if (isValid) {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.remove();
        }
    } else {
        field.classList.add('error');
        if (!errorElement && message) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = message;
            errorMsg.style.color = 'red';
            errorMsg.style.fontSize = '0.8em';
            errorMsg.style.marginTop = '5px';
            field.parentNode.insertBefore(errorMsg, field.nextSibling);
        } else if (errorElement) {
            errorElement.textContent = message;
        }
    }
}

/**
 * Validate the entire form
 */
function validateForm() {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['cardNumber', 'cardHolderName', 'cardExpiry', 'cardCvv', 'cardCpf', 'holderBirthDate'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            let fieldValid = true;
            let message = '';
            
            // Check if field is empty
            if (!field.value.trim()) {
                fieldValid = false;
                message = 'Campo obrigatório';
            } 
            // Check specific validations for each field
            else if (fieldId === 'cardNumber' && field.value.replace(/\D/g, '').length < 13) {
                fieldValid = false;
                message = 'Número do cartão inválido';
            }
            else if (fieldId === 'cardCvv' && (field.value.length < 3 || field.value.length > 4)) {
                fieldValid = false;
                message = 'CVV inválido';
            }
            else if (fieldId === 'cardCpf' && !validateCPF(field.value)) {
                fieldValid = false;
                message = 'CPF inválido';
            }
            
            // Update field state
            formState[fieldId] = { valid: fieldValid, message };
            updateFieldValidation(fieldId, fieldValid, message);
            
            if (!fieldValid) {
                isValid = false;
            }
        }
    });
    
    // Validate amount
    const amountInput = document.querySelector('input[name="amount"]:checked');
    if (!amountInput || !amountInput.value) {
        showError('Por favor, selecione um valor para doação');
        return false;
    }
    
    return isValid;
}

/**
 * Get form data
 */
function getFormData() {
    const amountInput = document.querySelector('input[name="amount"]:checked');
    const amount = amountInput ? parseFloat(amountInput.value) * 100 : 0; // Convert to cents
    
    return {
        // Customer data
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        phone: document.getElementById('phone').value.replace(/\D/g, ''),
        
        // Payment data
        amount: amount,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        
        // Credit card data (if applicable)
        cardHolderName: document.getElementById('cardHolderName')?.value.trim(),
        cardNumber: document.getElementById('cardNumber')?.value.replace(/\s/g, ''),
        cardExpiry: document.getElementById('cardExpiry')?.value,
        cardCvv: document.getElementById('cardCvv')?.value,
        cardCpf: document.getElementById('cardCpf')?.value.replace(/\D/g, ''),
        holderBirthDate: document.getElementById('holderBirthDate')?.value,
        
        // Installments
        installments: document.getElementById('installments')?.value || 1,
        
        // Recurring payment
        recurring: document.getElementById('recurring')?.checked || false
    };
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Validate form before submission
    if (!validateForm()) {
        showError('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    
    try {
        // Get form data
        const formData = getFormData();
        
        // Process payment based on selected method
        if (paymentMethod === 'credit_card') {
            await processCreditCardPayment(formData);
        } else if (paymentMethod === 'pix') {
            await processPixPayment(formData);
        } else if (paymentMethod === 'boleto') {
            await processBoletoPayment(formData);
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showError('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

/**
 * Process credit card payment with Asaas
 * @param {Object} formData - Form data
 */
async function processCreditCardPayment(formData) {
    try {
        // 1. Create or get customer
        const customer = await createCustomer(formData);
        
        // 2. Create credit card token
        const creditCardToken = await createCreditCardToken(formData, customer.id);
        
        // 3. Create payment
        const paymentData = {
            customer: customer.id,
            billingType: 'CREDIT_CARD',
            value: formData.amount / 100, // Convert back to reais
            dueDate: formatDate(new Date()),
            description: `Doação Vidas Sem Voz - ${formData.name}`,
            externalReference: `DONATION-${Date.now()}`,
            creditCard: {
                holderName: formData.cardHolderName,
                number: formData.cardNumber,
                expiryMonth: formData.cardExpiry?.split('/')[0],
                expiryYear: formData.cardExpiry?.split('/')[1] ? '20' + formData.cardExpiry.split('/')[1] : '',
                ccv: formData.cardCvv
            },
            creditCardHolderInfo: {
                name: formData.cardHolderName,
                email: formData.email,
                cpfCnpj: formData.cardCpf,
                postalCode: '00000000', // Required field, but not collected in the form
                addressNumber: '0', // Required field, but not collected in the form
                addressComplement: '',
                phone: formData.phone,
                mobilePhone: formData.phone
            },
            creditCardToken: creditCardToken.creditCardToken,
            remoteIp: await getClientIP()
        };
        
        // 4. Process payment
        const response = await fetch(window.ASAAS_CONFIG.createPaymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': window.ASAAS_CONFIG.apiKey
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao processar o pagamento');
        }
        
        // 5. Handle successful payment
        handlePaymentSuccess(result);
        
    } catch (error) {
        console.error('Credit card payment error:', error);
        throw error;
    }
}
/**
 * Process PIX payment with Asaas
 * @param {Object} formData - Form data
 */
async function processPixPayment(formData) {
    try {
        // 1. Create or get customer
        const customer = await createCustomer(formData);
        
        // 2. Create PIX payment
        const paymentData = {
            customer: customer.id,
            billingType: 'PIX',
            value: formData.amount / 100, // Convert back to reais
            dueDate: formatDate(new Date()),
            description: `Doação Vidas Sem Voz - ${formData.name}`,
            externalReference: `DONATION-${Date.now()}`
        };
        
        // 3. Create payment
        const response = await fetch(window.ASAAS_CONFIG.createPaymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': window.ASAAS_CONFIG.apiKey
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao gerar o PIX');
        }
        
        // 4. Show PIX QR code
        showPixQRCode(result.encodedImage, result.payload);
        
    } catch (error) {
        console.error('PIX payment error:', error);
        throw error;
    }
}

/**
 * Process Boleto payment with Asaas
 * @param {Object} formData - Form data
 */
async function processBoletoPayment(formData) {
    try {
        // 1. Create or get customer
        const customer = await createCustomer(formData);
        
        // 2. Create Boleto payment
        const paymentData = {
            customer: customer.id,
            billingType: 'BOLETO',
            value: formData.amount / 100, // Convert back to reais
            dueDate: formatDate(new Date()),
            description: `Doação Vidas Sem Voz - ${formData.name}`,
            externalReference: `DONATION-${Date.now()}`,
            postalService: false
        };
        
        // 3. Create payment
        const response = await fetch(window.ASAAS_CONFIG.createPaymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': window.ASAAS_CONFIG.apiKey
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao gerar o boleto');
        }
        
        // 4. Show boleto information
        showBoletoInfo(result.bankSlipUrl, result.identificationField);
        
    } catch (error) {
        console.error('Boleto payment error:', error);
        throw error;
    }
}

/**
 * Create or get customer in Asaas
 * @param {Object} formData - Form data
 */
async function createCustomer(formData) {
    try {
        // Check if customer exists by CPF
        const searchResponse = await fetch(`${window.ASAAS_CONFIG.createCustomerUrl}?cpfCnpj=${formData.cpf}`, {
            headers: {
                'access_token': window.ASAAS_CONFIG.apiKey
            }
        });
        
        const searchResult = await searchResponse.json();
        
        // If customer exists, return it
        if (searchResult.data && searchResult.data.length > 0) {
            return searchResult.data[0];
        }
        
        // Otherwise, create new customer
        const customerData = {
            name: formData.name,
            cpfCnpj: formData.cpf,
            email: formData.email,
            phone: formData.phone,
            mobilePhone: formData.phone,
            notificationDisabled: false,
            externalReference: `CUSTOMER-${Date.now()}`
        };
        
        const createResponse = await fetch(window.ASAAS_CONFIG.createCustomerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': window.ASAAS_CONFIG.apiKey
            },
            body: JSON.stringify(customerData)
        });
        
        const result = await createResponse.json();
        
        if (!createResponse.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao cadastrar cliente');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
}

/**
 * Create credit card token in Asaas
 * @param {Object} formData - Form data
 * @param {string} customerId - Customer ID
 */
async function createCreditCardToken(formData, customerId) {
    try {
        const tokenData = {
            customer: customerId,
            creditCard: {
                holderName: formData.cardHolderName,
                number: formData.cardNumber,
                expiryMonth: formData.cardExpiry.split('/')[0],
                expiryYear: '20' + formData.cardExpiry.split('/')[1],
                ccv: formData.cardCvv
            },
            creditCardHolderInfo: {
                name: formData.cardHolderName,
                email: formData.email,
                cpfCnpj: formData.cardCpf,
                postalCode: '00000000',
                addressNumber: '0',
                phone: formData.phone
            }
        };
        
        const response = await fetch(window.ASAAS_CONFIG.createCreditCardTokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': window.ASAAS_CONFIG.apiKey
            },
            body: JSON.stringify(tokenData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors ? result.errors[0].description : 'Erro ao processar o cartão');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating credit card token:', error);
        throw error;
    }
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 */
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-')
}

/**
 * Get client IP address
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || '0.0.0.0';
    } catch (error) {
        console.error('Error getting IP:', error);
        return '0.0.0.0';
    }
}

/**
 * Show PIX QR Code in a modal
 * @param {string} qrCodeImage - Base64 encoded QR code image
 * @param {string} qrCodeText - QR code text (payload)
 */
function showPixQRCode(qrCodeImage, qrCodeText) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Pague com PIX</h3>
            <p>Escaneie o QR Code abaixo ou copie o código para efetuar o pagamento:</p>
            <div class="qrcode-container">
                <img src="data:image/png;base64,${qrCodeImage}" alt="QR Code PIX">
            </div>
            <div class="pix-code">
                <input type="text" value="${qrCodeText}" readonly>
                <button onclick="copyToClipboard('${qrCodeText}')">Copiar Código</button>
            </div>
            <p>O QR Code expira em 30 minutos.</p>
            <button class="btn" onclick="this.closest('.modal').remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Show Boleto information in a modal
 * @param {string} boletoUrl - URL to the boleto
 * @param {string} barcode - Boleto barcode
 */
function showBoletoInfo(boletoUrl, barcode) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Boleto Bancário</h3>
            <p>Seu boleto foi gerado com sucesso!</p>
            <div class="barcode">
                <p>Código de barras:</p>
                <input type="text" value="${barcode}" readonly>
                <button onclick="copyToClipboard('${barcode}')">Copiar Código</button>
            </div>
            <div class="actions">
                <a href="${boletoUrl}" class="btn" target="_blank">Imprimir Boleto</a>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Código copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}

/**
 * Handle successful payment
 * @param {Object} result - Payment result
 */
function handlePaymentSuccess(result) {
    // Redirect to thank you page or show success message
    const successUrl = `/obrigado.html?payment_id=${result.id}&status=${result.status}`;
    window.location.href = successUrl;
}

/**
 * Show error message
 * @param {string} message - Error message
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

/**
 * Handle successful payment
 * @param {Object} result - Payment result
 */
function handlePaymentSuccess(result) {
    let successMessage = 'Doação realizada com sucesso! Obrigado pelo seu apoio.';
    
    // Handle different payment methods
    switch (result.payment_method) {
        case 'boleto':
            successMessage += '\n\nSeu boleto foi gerado com sucesso. ';
            successMessage += 'Clique no link abaixo para visualizar e imprimir:\n' + (result.payment_url || '');
            
            if (result.barcode) {
                successMessage += '\n\nCódigo de barras: ' + result.barcode;
            }
            
            if (result.payment_url) {
                window.open(result.payment_url, '_blank');
            }
            break;
            
        case 'pix':
            successMessage += '\n\nSeu QR Code PIX foi gerado com sucesso. ';
            successMessage += 'Escaneie o código abaixo para concluir o pagamento.';
            
            if (result.payment_url) {
                showPixQRCode(result.payment_url);
            }
            break;
            
        case 'credit_card':
            successMessage += `\n\nSeu pagamento foi aprovado com sucesso!`;
            if (result.id) {
                successMessage += `\nNúmero da transação: ${result.id}`;
            }
            if (result.authorization_code) {
                successMessage += `\nCódigo de autorização: ${result.authorization_code}`;
            }
            break;
    }
    
    showSuccess(successMessage);
    
    // Track donation
    trackDonation({
        transaction_id: result.id || result.transaction_id,
        amount: result.amount ? result.amount / 100 : 0,
        payment_method: result.payment_method,
        ...result
    });
    
    // Reset form
    const form = document.getElementById('donationForm');
    if (form && result.payment_method !== 'credit_card') {
        form.reset();
    }
}

/**
 * Handle payment error
 * @param {Error} error - Error object
 */
function handlePaymentError(error) {
    console.error('Payment error:', error);
    showError(error.message || 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.');
}

/**
 * Handle payment modal close
 */
function handlePaymentClose() {
    console.log('Payment modal closed');
}

/**
 * Show success message in a modal
 * @param {string} message - Success message
 */
function showSuccess(message) {
    // Implementation of showSuccess function
    console.log('Success:', message);
    alert(message); // Replace with modal implementation
}

/**
 * Show error message in a modal
 * @param {string} message - Error message
 */
function showError(message) {
    // Implementation of showError function
    console.error('Error:', message);
    alert('Erro: ' + message); // Replace with modal implementation
}

/**
 * Show PIX QR Code in a modal
 * @param {string} qrCodeUrl - URL or data for the PIX QR Code
 */
function showPixQRCode(qrCodeUrl) {
    // Implementation of showPixQRCode function
    console.log('Show PIX QR Code:', qrCodeUrl);
    // Show modal with QR code
}

/**
 * Track donation for analytics
 * @param {Object} data - Donation data
 */
function trackDonation(data) {
    // Implementation of trackDonation function
    console.log('Track donation:', data);
    
    // Example: Send to Google Analytics
    if (window.gtag) {
        gtag('event', 'purchase', {
            transaction_id: data.transaction_id,
            value: data.amount,
            currency: 'BRL',
            items: [{
                item_id: 'donation',
                item_name: 'Doação Vidas Sem Voz',
                price: data.amount,
                quantity: 1
            }]
        });
    }
}

/**
 * Initialize amount selection
 */
function initAmountSelection() {
    const amountOptions = document.querySelectorAll('.amount-option:not(#custom-amount-option)');
    const customAmountOption = document.getElementById('custom-amount-option');
    const customAmountInput = document.getElementById('custom-amount-input');
    const customAmountRadio = document.getElementById('custom-amount-radio');
    
    if (!customAmountOption || !customAmountInput || !customAmountRadio) return;
    
    // Handle preset amount selection
    amountOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.amount-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Uncheck custom amount radio if it was checked
            if (customAmountRadio.checked) {
                customAmountRadio.checked = false;
                customAmountInput.value = '';
            }
        });
    });
    
    // Handle custom amount input
    customAmountInput.addEventListener('click', function(e) {
        e.stopPropagation();
        customAmountOption.click();
    });
    
    customAmountInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (!isNaN(value) && value >= 5) {
            customAmountRadio.value = value;
            customAmountRadio.checked = true;
            
            // Update display
            const display = document.getElementById('custom-amount-display');
            if (display) {
                display.textContent = `R$ ${value.toFixed(2).replace('.', ',')}`;
            }
            
            // Update installments
            updateInstallments(value);
        }
    });
    
    // Handle radio button changes
    document.querySelectorAll('input[name="amount"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this === customAmountRadio) {
                customAmountInput.focus();
            } else {
                updateInstallments(parseFloat(this.value));
            }
        });
    });
}

/**
 * Initialize payment method tabs
 */
function initPaymentMethodTabs() {
    const tabs = document.querySelectorAll('.payment-method-tab');
    const paymentMethodInput = document.getElementById('paymentMethod');
    const creditCardFields = document.getElementById('creditCardFields');
    const pixFields = document.getElementById('pixFields');
    const boletoFields = document.getElementById('boletoFields');
    
    if (!paymentMethodInput || !creditCardFields || !pixFields || !boletoFields) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update payment method input
            paymentMethodInput.value = method;
            
            // Show/hide fields based on selected method
            creditCardFields.style.display = method === 'credit_card' ? 'block' : 'none';
            pixFields.style.display = method === 'pix' ? 'block' : 'none';
            boletoFields.style.display = method === 'boleto' ? 'block' : 'none';
            
            // Update installments if amount is set
            if (method === 'credit_card') {
                const selectedAmount = document.querySelector('input[name="amount"]:checked');
                if (selectedAmount) {
                    updateInstallments(parseFloat(selectedAmount.value));
                }
            }
        });
    });
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    // Add input masks
    const masks = {
        cpf: '000.000.000-00',
        phone: '(00) 00000-0000',
        cardNumber: '0000 0000 0000 0000',
        cardExpiry: '00/00',
        cardCvv: '0000'
    };
    
    Object.keys(masks).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.addEventListener('input', function(e) {
                const value = this.value.replace(/\D/g, '');
                const mask = masks[key];
                let maskedValue = '';
                let index = 0;
                
                for (let i = 0; i < mask.length; i++) {
                    if (index >= value.length) break;
                    
                    if (mask[i] === '0') {
                        maskedValue += value[index];
                        index++;
                    } else {
                        maskedValue += mask[i];
                    }
                }
                
                this.value = maskedValue;
                
                // For card number, detect card brand
                if (key === 'cardNumber' && pagarme) {
                    detectCardBrand(value);
                }
            });
        }
    });
}

/**
 * Detect card brand and update UI
 * @param {string} cardNumber - Card number without formatting
 */
function detectCardBrand(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) {
        updateCardBrandIcon('');
        return;
    }
    
    // This is a simplified version - you might want to use a more robust solution
    const cardBrands = {
        'visa': /^4/,
        'mastercard': /^5[1-5]/,
        'amex': /^3[47]/,
        'elo': /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|636369)/,
        'hipercard': /^(606282|3841)/,
        'diners': /^3(?:0[0-5]|[68][0-9])/,
        'discover': /^6(?:011|5|4[4-9]|22)/,
        'jcb': /^(?:2131|1800|35)/
    };
    
    for (const [brand, pattern] of Object.entries(cardBrands)) {
        if (pattern.test(cardNumber)) {
            updateCardBrandIcon(brand);
            return;
        }
    }
    
    updateCardBrandIcon('');
}

/**
 * Update card brand icon in the UI
 * @param {string} brand - Card brand (visa, mastercard, etc.)
 */
function updateCardBrandIcon(brand) {
    const brandIcon = document.getElementById('card-brand');
    if (!brandIcon) return;
    
    // Clear previous classes
    brandIcon.className = 'card-brand-icon';
    
    if (brand) {
        brandIcon.classList.add(brand);
        brandIcon.innerHTML = `<i class="fab fa-cc-${brand}"></i>`;
    } else {
        brandIcon.innerHTML = '';
    }
}

/**
 * Initialize installments calculation
 */
function initInstallments() {
    // Set up event listeners for amount changes
    const amountInputs = document.querySelectorAll('input[name="amount"]');
    amountInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked && document.getElementById('paymentMethod').value === 'credit_card') {
                updateInstallments(parseFloat(this.value));
            }
        });
    });
}

/**
 * Update installments based on amount
 * @param {number} amount - Donation amount
 */
function updateInstallments(amount) {
    if (!amount || amount < 5) return;
    
    const installmentsSelect = document.getElementById('installments');
    if (!installmentsSelect) return;
    
    // Clear existing options
    installmentsSelect.innerHTML = '';
    
    // Calculate max installments (up to 12x)
    const maxInstallments = Math.min(Math.floor(amount / 5), 12);
    
    // Add installments options
    for (let i = 1; i <= maxInstallments; i++) {
        const installmentAmount = (amount / i).toFixed(2);
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x de R$ ${installmentAmount.replace('.', ',')} ${i === 1 ? 'à vista' : 'sem juros'}`;
        installmentsSelect.appendChild(option);
    }
}
