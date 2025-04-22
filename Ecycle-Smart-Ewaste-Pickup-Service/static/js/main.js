document.addEventListener('DOMContentLoaded', function() {
    // Image upload preview for e-waste classification
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const classifyBtn = document.getElementById('classifyBtn');
    const classificationResult = document.getElementById('classificationResult');
    const ewastetype = document.getElementById('ewaste_type');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (imageUpload) {
        imageUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle image classification
    if (classifyBtn) {
        classifyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!imageUpload || !imageUpload.files[0]) {
                alert('Please select an image first');
                return;
            }
            
            // Show loading spinner
            loadingSpinner.classList.remove('d-none');
            classificationResult.innerHTML = '';
            
            const formData = new FormData();
            formData.append('image', imageUpload.files[0]);
            
            fetch('/classify', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                loadingSpinner.classList.add('d-none');
                
                if (data.error) {
                    classificationResult.innerHTML = `
                        <div class="alert alert-danger">
                            ${data.error}
                        </div>
                    `;
                    return;
                }
                
                // Update form with classification results
                if (ewastetype) {
                    ewastetype.value = data.ewaste_type;
                }
                
                classificationResult.innerHTML = `
                    <div class="alert alert-success">
                        <h5>Classification Result:</h5>
                        <p><strong>Detected:</strong> ${data.ewaste_type}</p>
                        <p><strong>Confidence:</strong> ${data.confidence}</p>
                        <div class="mt-3">
                            <h6>Recycling Information:</h6>
                            <p>${data.recycling_info}</p>
                        </div>
                    </div>
                `;
            })
            .catch(error => {
                loadingSpinner.classList.add('d-none');
                classificationResult.innerHTML = `
                    <div class="alert alert-danger">
                        Error: ${error.message}
                    </div>
                `;
            });
        });
    }
    
    // Price estimation calculation based on form inputs
    const ewaseTypeSelect = document.getElementById('ewaste_type');
    const conditionSelect = document.getElementById('condition');
    const estimatedPriceDisplay = document.getElementById('estimatedPrice');
    const ecoPointsDisplay = document.getElementById('ecoPoints');
    const carbonSavedDisplay = document.getElementById('carbonSaved');
    
    function updateEstimatedPrice() {
        if (!ewaseTypeSelect || !conditionSelect) return;
        
        const ewaseType = ewaseTypeSelect.value;
        const condition = conditionSelect.value;
        
        // Updated price map with the new e-waste categories
        const priceMap = {
            // Computers & Accessories
            'Laptop': 200,
            'Desktop-PC': 250,
            'Tablet': 100,
            'Computer-Keyboard': 20,
            'Computer-Mouse': 15,
            
            // Phones & Wearables
            'Smartphone': 150,
            'Smart-Watch': 50,
            
            // Displays
            'Flat-Panel-Monitor': 120,
            'CRT-Monitor': 80,
            'Flat-Panel-TV': 180,
            'CRT-TV': 100,
            'Projector': 150,
            
            // Appliances
            'Air-Conditioner': 250,
            'Washing-Machine': 200,
            'Refrigerator': 300,
            'Freezer': 250,
            'Microwave': 80,
            'Dishwasher': 120,
            'Coffee-Machine': 60,
            'Vacuum-Cleaner': 70,
            
            // Electronics
            'Printer': 70,
            'Camera': 90,
            'Router': 40,
            'Speaker': 50,
            'Headphone': 30,
            'Battery': 20,
            'LED-Bulb': 10,
            'USB-Flash-Drive': 15,
            
            // Legacy compatibility
            'Mobile': 150,
            'Desktop': 250,
            'Monitor': 120,
            'Other': 50
        };
        
        // Multipliers based on condition
        const conditionMultiplier = {
            'Excellent': 1.5,
            'Good': 1.2,
            'Fair': 1.0,
            'Poor': 0.8
        };
        
        // Updated carbon savings by e-waste type (kg CO2)
        const carbonSavingsMap = {
            // Computers & Accessories
            'Laptop': 140,
            'Desktop-PC': 200,
            'Tablet': 80,
            'Computer-Keyboard': 8,
            'Computer-Mouse': 5,
            
            // Phones & Wearables
            'Smartphone': 60,
            'Smart-Watch': 20,
            
            // Displays
            'Flat-Panel-Monitor': 90,
            'CRT-Monitor': 150,
            'Flat-Panel-TV': 120,
            'CRT-TV': 180,
            'Projector': 70,
            
            // Appliances
            'Air-Conditioner': 300,
            'Washing-Machine': 240,
            'Refrigerator': 350,
            'Freezer': 300,
            'Microwave': 100,
            'Dishwasher': 150,
            'Coffee-Machine': 50,
            'Vacuum-Cleaner': 80,
            
            // Electronics
            'Printer': 50,
            'Camera': 40,
            'Router': 30,
            'Speaker': 25,
            'Headphone': 15,
            'Battery': 10,
            'LED-Bulb': 5,
            'USB-Flash-Drive': 6,
            
            // Legacy compatibility
            'Mobile': 60,
            'Desktop': 200,
            'Monitor': 90,
            'Other': 40
        };
        
        // Use the price from the map or default to 50
        const basePrice = priceMap[ewaseType] || 50;
        const multiplier = conditionMultiplier[condition] || 1.0;
        
        // Calculate price with condition modifier
        const estimatedPrice = Math.round(basePrice * multiplier);
        
        // Calculate eco points - higher value items earn more points per dollar
        let ecoPointsMultiplier = 0.1; // Default 10% of price
        
        // Higher multiplier for high-value/high-impact items
        if (['Laptop', 'Desktop-PC', 'Smartphone', 'Flat-Panel-TV', 'Refrigerator'].includes(ewaseType)) {
            ecoPointsMultiplier = 0.15; // 15% of price
        }
        // Lower multiplier for low-value/low-impact items
        else if (['LED-Bulb', 'USB-Flash-Drive', 'Battery', 'Computer-Mouse'].includes(ewaseType)) {
            ecoPointsMultiplier = 0.08; // 8% of price
        }
        
        const ecoPoints = Math.floor(estimatedPrice * ecoPointsMultiplier);
        
        // Get carbon savings from the map or default to 40kg
        const carbonSaved = carbonSavingsMap[ewaseType] || 40;
        
        if (estimatedPriceDisplay) {
            estimatedPriceDisplay.textContent = `$${estimatedPrice}`;
        }
        
        if (ecoPointsDisplay) {
            ecoPointsDisplay.textContent = ecoPoints;
        }
        
        if (carbonSavedDisplay) {
            carbonSavedDisplay.textContent = `${carbonSaved} kg`;
        }
    }
    
    if (ewaseTypeSelect && conditionSelect) {
        ewaseTypeSelect.addEventListener('change', updateEstimatedPrice);
        conditionSelect.addEventListener('change', updateEstimatedPrice);
        
        // Initialize price display
        updateEstimatedPrice();
    }
});
