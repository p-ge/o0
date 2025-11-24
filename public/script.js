// Configuration
const API_BASE_URL = window.location.origin;
const API_KEY = prompt('Enter API Key:') || ''; // In production, use a secure method
const REFRESH_INTERVAL = 5000; // 5 seconds

let servers = [];
let stats = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setInterval(loadData, REFRESH_INTERVAL);
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    document.getElementById('minValueFilter').addEventListener('change', renderServers);
    document.getElementById('searchFilter').addEventListener('input', renderServers);
    document.getElementById('sortFilter').addEventListener('change', renderServers);
});

// Load data from API
async function loadData() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });
        
        if (statsResponse.ok) {
            stats = await statsResponse.json();
            updateStats();
            updateStatus(true);
        } else {
            updateStatus(false);
            return;
        }

        // Load servers
        const serversResponse = await fetch(`${API_BASE_URL}/api/servers`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (serversResponse.ok) {
            servers = await serversResponse.json();
            renderServers();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus(false);
    }
}

// Update statistics display
function updateStats() {
    document.getElementById('activeCount').textContent = stats.active || 0;
    document.getElementById('totalFound').textContent = stats.totalFound || 0;
    document.getElementById('expiredCount').textContent = stats.totalExpired || 0;
    document.getElementById('uptime').textContent = formatUptime(stats.uptime || 0);
}

// Update connection status
function updateStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// Format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

// Render servers with filters
function renderServers() {
    const minValue = parseInt(document.getElementById('minValueFilter').value) || 0;
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const sortBy = document.getElementById('sortFilter').value;

    // Filter servers
    let filtered = servers.filter(server => {
        const matchesValue = server.value >= minValue;
        const matchesSearch = !searchTerm || server.displayName.toLowerCase().includes(searchTerm);
        return matchesValue && matchesSearch;
    });

    // Sort servers
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'value-desc':
                return b.value - a.value;
            case 'value-asc':
                return a.value - b.value;
            case 'time-desc':
                return b.timestamp - a.timestamp;
            case 'time-asc':
                return a.timestamp - b.timestamp;
            case 'rarity':
                const rarityOrder = { 'Secret': 5, 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
                return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
            default:
                return 0;
        }
    });

    // Render
    const container = document.getElementById('serversList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No servers match the current filters.</p></div>';
        return;
    }

    container.innerHTML = filtered.map(server => createServerCard(server)).join('');
    
    // Add event listeners to join buttons
    filtered.forEach(server => {
        const btn = document.getElementById(`join-${server.id}`);
        if (btn) {
            btn.addEventListener('click', () => joinServer(server));
        }
    });
}

// Create server card HTML
function createServerCard(server) {
    const timeRemaining = Math.max(0, Math.floor((server.expiresAt - Date.now()) / 1000));
    const timeFormatted = formatTimeRemaining(timeRemaining);
    const timeClass = timeRemaining < 30 ? 'danger' : timeRemaining < 60 ? 'warning' : '';
    
    const valueClass = server.value >= 5000000 ? 'value-high' : 
                      server.value >= 2000000 ? 'value-medium' : 'value-low';
    
    const rarityClass = getRarityClass(server.rarity);

    return `
        <div class="server-card">
            <div class="server-header">
                <div class="server-name">${escapeHtml(server.displayName)}</div>
                <div class="server-value ${valueClass}">${server.valueFormatted || formatValue(server.value)}</div>
            </div>
            <div class="server-details">
                <div class="detail-item">
                    <div class="detail-label">Mutation</div>
                    <div class="detail-value">${escapeHtml(server.mutation || 'N/A')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Rarity</div>
                    <div class="detail-value">
                        <span class="rarity-badge ${rarityClass}">${escapeHtml(server.rarity || 'N/A')}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Players</div>
                    <div class="detail-value">${escapeHtml(server.players || 'N/A')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Job ID</div>
                    <div class="detail-value" style="font-size: 11px; font-family: monospace;">${escapeHtml(server.jobId || 'N/A')}</div>
                </div>
            </div>
            <div class="server-footer">
                <div class="time-remaining ${timeClass}">⏱️ ${timeFormatted} remaining</div>
                <button id="join-${server.id}" class="btn-join">Join Server</button>
            </div>
        </div>
    `;
}

// Format time remaining
function formatTimeRemaining(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format value
function formatValue(value) {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B/s`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M/s`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K/s`;
    return `$${value}/s`;
}

// Get rarity CSS class
function getRarityClass(rarity) {
    if (!rarity) return 'rarity-common';
    const r = rarity.toLowerCase();
    if (r.includes('secret')) return 'rarity-secret';
    if (r.includes('legendary')) return 'rarity-legendary';
    if (r.includes('epic')) return 'rarity-epic';
    if (r.includes('rare')) return 'rarity-rare';
    return 'rarity-common';
}

// Join server (copy teleport script)
async function joinServer(server) {
    if (server.teleportScript) {
        // Copy script to clipboard
        try {
            await navigator.clipboard.writeText(server.teleportScript);
            alert('Teleport script copied to clipboard!');
            
            // Remove server from API
            try {
                await fetch(`${API_BASE_URL}/api/servers/${server.jobId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-API-Key': API_KEY,
                    },
                });
                // Reload data
                loadData();
            } catch (error) {
                console.error('Error removing server:', error);
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Failed to copy script. Please copy manually.');
        }
    } else {
        alert('No teleport script available for this server.');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

