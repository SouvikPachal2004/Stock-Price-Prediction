document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    const preloader = document.querySelector('.preloader');
    window.addEventListener('load', function() {
        preloader.classList.add('hidden');
    });

    // Set default dates
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    document.getElementById('start-date').valueAsDate = lastMonth;
    document.getElementById('end-date').valueAsDate = today;
    
    // Chart instance
    let stockChart = null;
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenuBtn.classList.toggle('active');
        navList.classList.toggle('active');
    });
    
    // Form submission
    document.getElementById('predict-btn').addEventListener('click', function() {
        const ticker = document.getElementById('stock-ticker').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const predictionDays = document.getElementById('prediction-days').value;
        
        // Validate inputs
        if (!ticker || !startDate || !endDate || !predictionDays) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (new Date(startDate) >= new Date(endDate)) {
            showNotification('Start date must be before end date', 'error');
            return;
        }
        
        // Show loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('predict-btn').disabled = true;
        
        // Fetch data and predict
        fetchStockData(ticker, startDate, endDate, predictionDays);
    });
    
    // Function to fetch stock data and make prediction
    function fetchStockData(ticker, startDate, endDate, predictionDays) {
        // In a real application, this would be an API call to your backend
        // For demonstration, we'll simulate the API call with a timeout
        
        setTimeout(() => {
            // Simulate API response
            const historicalData = generateHistoricalData(startDate, endDate);
            const predictionData = generatePredictionData(historicalData, predictionDays);
            
            // Update chart
            updateChart(historicalData, predictionData);
            
            // Update prediction info
            updatePredictionInfo(historicalData, predictionData);
            
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            document.getElementById('predict-btn').disabled = false;
            
            showNotification('Prediction completed successfully!', 'success');
        }, 1500);
    }
    
    // Function to generate mock historical data
    function generateHistoricalData(startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        let currentPrice = 100 + Math.random() * 100; // Random starting price between 100-200
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            
            // Random walk with slight upward bias
            const change = (Math.random() - 0.48) * 5;
            currentPrice += change;
            
            data.push({
                date: new Date(d),
                price: currentPrice
            });
        }
        
        return data;
    }
    
    // Function to generate mock prediction data
    function generatePredictionData(historicalData, days) {
        const data = [];
        const lastPrice = historicalData[historicalData.length - 1].price;
        let currentPrice = lastPrice;
        const lastDate = new Date(historicalData[historicalData.length - 1].date);
        
        for (let i = 1; i <= days; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            
            // Skip weekends
            if (nextDate.getDay() === 0 || nextDate.getDay() === 6) continue;
            
            // Random walk with slight upward bias
            const change = (Math.random() - 0.45) * 5;
            currentPrice += change;
            
            data.push({
                date: nextDate,
                price: currentPrice,
                predicted: true
            });
        }
        
        return data;
    }
    
    // Function to update the chart
    function updateChart(historicalData, predictionData) {
        const ctx = document.getElementById('stock-chart').getContext('2d');
        
        // Combine data
        const allData = [...historicalData, ...predictionData];
        
        // Prepare labels and datasets
        const labels = allData.map(item => item.date.toLocaleDateString());
        const prices = allData.map(item => item.price);
        const backgroundColors = allData.map(item => item.predicted ? 'rgba(45, 206, 137, 0.2)' : 'rgba(94, 114, 228, 0.2)');
        const borderColors = allData.map(item => item.predicted ? 'rgba(45, 206, 137, 1)' : 'rgba(94, 114, 228, 1)');
        
        // Destroy existing chart if it exists
        if (stockChart) {
            stockChart.destroy();
        }
        
        // Create new chart
        stockChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Price',
                    data: prices,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    pointBackgroundColor: borderColors,
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const isPredicted = allData[index].predicted;
                                return `${isPredicted ? 'Predicted' : 'Historical'} Price: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    // Function to update prediction info
    function updatePredictionInfo(historicalData, predictionData) {
        const currentPrice = historicalData[historicalData.length - 1].price;
        const predictedPrice = predictionData[predictionData.length - 1].price;
        const priceChange = predictedPrice - currentPrice;
        const percentChange = (priceChange / currentPrice) * 100;
        
        // Random confidence between 70-95%
        const confidence = 70 + Math.random() * 25;
        
        document.getElementById('current-price').textContent = `$${currentPrice.toFixed(2)}`;
        document.getElementById('predicted-price').textContent = `$${predictedPrice.toFixed(2)}`;
        
        const changeElement = document.getElementById('price-change');
        changeElement.textContent = `${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
        changeElement.style.color = priceChange >= 0 ? 'var(--accent-color)' : 'var(--danger-color)';
        
        document.getElementById('confidence').textContent = `${confidence.toFixed(1)}%`;
    }
    
    // Function to show notification
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.minWidth = '300px';
        notification.style.padding = '15px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.zIndex = '10000';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.justifyContent = 'space-between';
        notification.style.animation = 'slideInRight 0.3s ease';
        
        if (type === 'success') {
            notification.style.backgroundColor = 'rgba(45, 206, 137, 0.9)';
            notification.style.color = 'white';
        } else {
            notification.style.backgroundColor = 'rgba(245, 54, 92, 0.9)';
            notification.style.color = 'white';
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }
        }, 5000);
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
                
                // Close mobile menu if open
                mobileMenuBtn.classList.remove('active');
                navList.classList.remove('active');
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
        
        // Back to top button
        const backToTop = document.getElementById('back-to-top');
        if (window.scrollY > 300) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });
    
    // Back to top button
    document.getElementById('back-to-top').addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Contact form submission
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // In a real application, you would send this data to your backend
        // For demonstration, we'll just show a success message
        
        showNotification('Your message has been sent successfully!', 'success');
        
        // Reset form
        this.reset();
    });
    
    // Add CSS for notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
        }
        
        .notification-content i {
            margin-right: 10px;
            font-size: 1.2rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1rem;
            padding: 5px;
            margin-left: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // Add animation classes to elements
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .tech-item, .info-card, .diagram-step');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.classList.add('fade-up');
            }
        });
    };
    
    // Initial check on load
    animateOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', animateOnScroll);
});