// Variáveis globais
let map;
let startMarker;
let destinationMarker;
let startPoint = null;
let destination = null;
let routingControl = null;
let isSettingStartPoint = false;
let isSettingDestination = false;

// Inicializa o mapa quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    
    // Event listeners para os botões
    document.getElementById('searchStartPoint').addEventListener('click', function() {
        searchLocation('startPoint', true);
    });
    
    document.getElementById('searchDestination').addEventListener('click', function() {
        searchLocation('destination', false);
    });
    
    document.getElementById('setStartOnMap').addEventListener('click', function() {
        isSettingStartPoint = true;
        isSettingDestination = false;
        document.getElementById('status').textContent = 'Clique no mapa para definir o ponto de partida';
    });
    
    document.getElementById('setDestOnMap').addEventListener('click', function() {
        isSettingDestination = true;
        isSettingStartPoint = false;
        document.getElementById('status').textContent = 'Clique no mapa para definir o destino';
    });
    
    document.getElementById('useMyLocation').addEventListener('click', getUserLocation);
    document.getElementById('calculateRoute').addEventListener('click', calculateRoute);
    document.getElementById('clearRoute').addEventListener('click', clearAll);
    
    // Permite buscar com Enter
    document.getElementById('startPoint').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation('startPoint', true);
        }
    });
    
    document.getElementById('destination').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation('destination', false);
        }
    });
});

function initMap() {
    // Carrega o Leaflet CSS e JS dinamicamente se não estiverem carregados
    if (typeof L === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.onload = function() {
            // Carrega o plugin de roteamento
            const routingScript = document.createElement('script');
            routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
            routingScript.onload = initializeMap;
            document.body.appendChild(routingScript);
            
            // Carrega o CSS do roteamento
            const routingCss = document.createElement('link');
            routingCss.rel = 'stylesheet';
            routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
            document.head.appendChild(routingCss);
        };
        document.body.appendChild(script);
    } else {
        initializeMap();
    }
}

function initializeMap() {
    // Cria o mapa centralizado no Brasil
    map = L.map('map').setView([-15.7975, -47.8919], 4);
    
    // Adiciona os tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Configura o clique no mapa
    map.on('click', function(e) {
        if (isSettingStartPoint) {
            setStartPoint(e.latlng);
            document.getElementById('startPoint').value = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
            isSettingStartPoint = false;
        } else if (isSettingDestination) {
            setDestination(e.latlng);
            document.getElementById('destination').value = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
            isSettingDestination = false;
        }
    });
    
    document.getElementById('status').textContent = 'Defina o ponto de partida e o destino para calcular a rota';
}

// Função para buscar localização usando Nominatim (OpenStreetMap)
function searchLocation(fieldId, isStartPoint) {
    const query = document.getElementById(fieldId).value.trim();
    
    if (!query) {
        document.getElementById('status').textContent = 'Por favor, digite um local para buscar';
        return;
    }
    
    document.getElementById('status').textContent = 'Buscando local...';
    
    // Usa o Nominatim para geocodificação
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                document.getElementById('status').textContent = 'Local não encontrado. Tente outro termo.';
                return;
            }
            
            // Pega o primeiro resultado (mais relevante)
            const result = data[0];
            const latLng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
            
            if (isStartPoint) {
                setStartPoint(latLng);
                document.getElementById('startPoint').value = result.display_name || query;
            } else {
                setDestination(latLng);
                document.getElementById('destination').value = result.display_name || query;
            }
            
            // Centraliza o mapa no local encontrado
            map.setView(latLng, 15);
            document.getElementById('status').textContent = 'Local encontrado!';
        })
        .catch(error => {
            console.error('Erro na busca:', error);
            document.getElementById('status').textContent = 'Erro ao buscar local. Tente novamente.';
        });
}

function setStartPoint(position) {
    startPoint = position;
    updateStartMarker(startPoint);
    document.getElementById('status').textContent = 'Ponto de partida definido! Agora defina o destino.';
}

function setDestination(position) {
    destination = position;
    updateDestinationMarker(destination);
    document.getElementById('status').textContent = 'Destino definido! Clique em "Calcular Rota".';
}

function updateStartMarker(position) {
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    
    startMarker = L.marker(position, {
        title: 'Ponto de Partida',
        alt: 'Ponto de partida',
        riseOnHover: true
    }).addTo(map)
    .bindPopup('Ponto de Partida');
    
    // Aplica estilo diferente para o marcador de partida
    if (startMarker._icon) {
        startMarker._icon.classList.add('start-marker');
    }
}

function updateDestinationMarker(position) {
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }
    
    destinationMarker = L.marker(position, {
        title: 'Destino',
        alt: 'Destino selecionado',
        riseOnHover: true
    }).addTo(map)
    .bindPopup('Destino');
}

function getUserLocation() {
    if (navigator.geolocation) {
        document.getElementById('status').textContent = 'Obtendo sua localização...';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = L.latLng(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                setStartPoint(userLocation);
                document.getElementById('startPoint').value = 'Minha Localização';
                map.setView(userLocation, 15);
            },
            function(error) {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permissão negada pelo usuário.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Localização indisponível.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Tempo de espera excedido.";
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage = "Erro desconhecido.";
                        break;
                }
                document.getElementById('status').textContent = 'Erro: ' + errorMessage;
            }
        );
    } else {
        document.getElementById('status').textContent = 'Geolocalização não é suportada pelo seu navegador.';
    }
}

function calculateRoute() {
    if (!startPoint) {
        document.getElementById('status').textContent = 'Por favor, defina o ponto de partida primeiro.';
        return;
    }
    
    if (!destination) {
        document.getElementById('status').textContent = 'Por favor, defina o destino.';
        return;
    }
    
    document.getElementById('status').textContent = 'Calculando rota...';
    
    // Remove a rota anterior se existir
    if (routingControl) {
        map.removeControl(routingControl);
    }
    
    // Configura o serviço de roteamento
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startPoint.lat, startPoint.lng),
            L.latLng(destination.lat, destination.lng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{color: '#4285F4', opacity: 0.7, weight: 5}]
        },
        collapsible: true
    }).addTo(map);
    
    // Quando a rota é calculada
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const route = routes[0];
        
        const distance = (route.summary.totalDistance / 1000).toFixed(1); // em km
        const time = (route.summary.totalTime / 60).toFixed(0); // em minutos
        
        document.getElementById('status').textContent = 
            `Rota calculada! Distância: ${distance} km, Tempo estimado: ${time} minutos`;
    });
    
    routingControl.on('routingerror', function(e) {
        document.getElementById('status').textContent = 'Erro ao calcular rota: ' + e.error.message;
    });
}

function clearAll() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    document.getElementById('startPoint').value = '';
    document.getElementById('destination').value = '';
    startPoint = null;
    destination = null;
    
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }
    
    isSettingStartPoint = false;
    isSettingDestination = false;
    
    document.getElementById('status').textContent = 'Tudo limpo. Defina novos pontos de partida e destino.';
}