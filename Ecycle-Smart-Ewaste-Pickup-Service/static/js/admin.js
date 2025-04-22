document.addEventListener('DOMContentLoaded', function() {
    // Status update handling
    const statusButtons = document.querySelectorAll('.update-status-btn');
    
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-id');
            const newStatus = this.getAttribute('data-status');
            const currentRow = this.closest('tr');
            
            if (!confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
                return;
            }
            
            // Show loading state
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
            this.disabled = true;
            
            const formData = new FormData();
            formData.append('schedule_id', scheduleId);
            formData.append('status', newStatus);
            
            fetch('/admin/update_status', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                    this.disabled = false;
                    this.textContent = 'Retry';
                    return;
                }
                
                // Update the row status
                const statusCell = currentRow.querySelector('.status-cell');
                statusCell.innerHTML = `
                    <span class="badge ${newStatus === 'Collected' ? 'bg-success' : 'bg-warning'}">
                        ${newStatus}
                    </span>
                `;
                
                // Replace the button row
                const actionCell = currentRow.querySelector('.action-cell');
                if (newStatus === 'Collected') {
                    actionCell.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Completed</span>';
                } else {
                    // Re-render the other button option
                    actionCell.innerHTML = `
                        <button class="btn btn-sm btn-success update-status-btn" 
                                data-id="${scheduleId}" 
                                data-status="Collected">
                            Mark as Collected
                        </button>
                    `;
                    // Re-attach event listener to the new button
                    const newButton = actionCell.querySelector('.update-status-btn');
                    newButton.addEventListener('click', function() {
                        const scheduleId = this.getAttribute('data-id');
                        const newStatus = this.getAttribute('data-status');
                        // ... reuse the same logic
                    });
                }
                
                // Show success toast or message
                showToast('Success', `Status updated to ${newStatus} successfully!`, 'success');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while updating the status.');
                this.disabled = false;
                this.textContent = 'Retry';
            });
        });
    });
    
    // Filter pickups by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const status = this.value;
            window.location.href = `/admin/pickups${status ? '?status=' + status : ''}`;
        });
    }
    
    // Search functionality for pickups
    const searchInput = document.getElementById('searchPickups');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Edit points modal setup
    const editPointsBtns = document.querySelectorAll('.edit-points-btn');
    editPointsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const username = this.getAttribute('data-username');
            const ecoPoints = this.getAttribute('data-eco-points');
            
            document.getElementById('editUserId').value = userId;
            document.getElementById('editUsername').value = username;
            document.getElementById('currentPoints').value = ecoPoints;
            document.getElementById('newPoints').value = ecoPoints;
        });
    });
    
    // Save points changes
    const savePointsBtn = document.getElementById('savePointsBtn');
    if (savePointsBtn) {
        savePointsBtn.addEventListener('click', function() {
            const form = document.getElementById('editPointsForm');
            const userId = document.getElementById('editUserId').value;
            const newPoints = document.getElementById('newPoints').value;
            const reason = document.getElementById('adjustmentReason').value;
            
            if (!newPoints || !reason) {
                alert('Please fill in all fields');
                return;
            }
            
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('eco_points', newPoints);
            formData.append('reason', reason);
            
            // Show loading state
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            this.disabled = true;
            
            fetch('/admin/update_eco_points', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                    this.disabled = false;
                    this.textContent = 'Save Changes';
                    return;
                }
                
                // Update the row with new points (if on users list page)
                const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
                if (userRow) {
                    const pointsCell = userRow.querySelector('.eco-points-cell');
                    if (pointsCell) {
                        pointsCell.textContent = newPoints;
                    }
                }
                
                // Close modal and reset button
                const modal = bootstrap.Modal.getInstance(document.getElementById('editPointsModal'));
                modal.hide();
                this.disabled = false;
                this.textContent = 'Save Changes';
                
                // Show success message
                showToast('Success', 'User eco points updated successfully!', 'success');
                
                // If on user detail page, reload to reflect changes
                if (window.location.pathname.includes('/admin/users/')) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while updating the eco points.');
                this.disabled = false;
                this.textContent = 'Save Changes';
            });
        });
    }
    
    // Auto-calculate price and eco points on add e-waste form
    const calculateBtn = document.getElementById('calculatePriceBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            const ewaste_type = document.getElementById('ewaste_type').value;
            const condition = document.getElementById('condition').value;
            
            if (!ewaste_type || !condition) {
                alert('Please select both E-waste Type and Condition first');
                return;
            }
            
            // Price calculations (same as in the backend)
            const price_map = {
                'Laptop': 100,
                'Mobile': 50,
                'Desktop': 150,
                'Tablet': 75,
                'Monitor': 60,
                'Printer': 40,
                'Other': 30
            };
            
            const condition_multiplier = {
                'Excellent': 1.5,
                'Good': 1.2,
                'Fair': 1.0,
                'Poor': 0.8
            };
            
            const base_price = price_map[ewaste_type] || 30;
            const estimated_price = Math.round(base_price * condition_multiplier[condition]);
            const eco_points = Math.floor(estimated_price / 10);
            
            // Update the form fields
            document.getElementById('estimated_price').value = estimated_price;
            document.getElementById('eco_points').value = eco_points;
            
            // Show a confirmation message
            showToast('Calculated', `Estimated price: $${estimated_price}, Eco points: ${eco_points}`, 'info');
        });
    }
    
    // Pre-select user in the add-ewaste form if provided in URL
    const userSelect = document.getElementById('user_id');
    const preSelectedUserId = document.querySelector('meta[name="pre-selected-user-id"]')?.content;
    if (userSelect && preSelectedUserId) {
        userSelect.value = preSelectedUserId;
    }
});

// Utility function to show toast notifications
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '5';
    toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
