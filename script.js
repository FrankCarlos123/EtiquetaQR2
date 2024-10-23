let selectedLabels = [];
let currentIndex = 0;

function clearLabelsContainer() {
    const container = document.getElementById('labelsContainer');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function createInitialLabels() {
    clearLabelsContainer(); // Limpiamos el contenedor antes de crear nuevas etiquetas
    selectedLabels = []; // Limpiamos el array de etiquetas
    
    for(let i = 0; i < 10; i++) {
        addLabel('', 'https://via.placeholder.com/150', '');
    }
}

async function buscarProductos() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=24`);
        const data = await response.json();
        
        if (!data.products?.length) {
            resultsContainer.innerHTML = '<p>No se encontraron productos.</p>';
            return;
        }
        
        resultsContainer.innerHTML = data.products.map(product => `
            <div class="product-card" onclick="seleccionarProducto('${product.image_url || ''}', '${product.product_name?.replace(/'/g, "\\'") || ''}')">
                <img src="${product.image_url || ''}" alt="${product.product_name || ''}" onerror="this.src='https://via.placeholder.com/150'">
                <h3>${product.product_name || 'Nombre no disponible'}</h3>
            </div>
        `).join('');
    } catch (error) {
        resultsContainer.innerHTML = '<p>Error al buscar productos.</p>';
        console.error(error);
    }
}

function addLabel(productName, imgSrc, qrData) {
    const container = document.getElementById('labelsContainer');
    const labelRow = document.createElement('div');
    labelRow.classList.add('label-row');

    const productCell = document.createElement('div');
    productCell.classList.add('product-cell');
    const productImg = document.createElement('img');
    productImg.src = imgSrc;
    productCell.appendChild(productImg);

    const nameCell = document.createElement('div');
    nameCell.classList.add('name-cell');
    const nameTextarea = document.createElement('textarea');
    nameTextarea.value = productName;
    nameTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, this.parentElement.offsetHeight - 4) + 'px';
    });
    nameCell.appendChild(nameTextarea);

    const qrCell = document.createElement('div');
    qrCell.classList.add('qr-cell');
    const qrImg = document.createElement('img');
    qrImg.src = qrData || '';
    qrCell.appendChild(qrImg);

    labelRow.appendChild(productCell);
    labelRow.appendChild(nameCell);
    labelRow.appendChild(qrCell);

    container.appendChild(labelRow);
    
    selectedLabels.push({
        imgElement: productImg,
        nameInput: nameTextarea,
        qrImg,
        row: labelRow
    });
}

function seleccionarProducto(imageUrl, name) {
    if (currentIndex >= 10) currentIndex = 0;
    
    if (selectedLabels[currentIndex]) {
        selectedLabels[currentIndex].imgElement.src = imageUrl || 'https://via.placeholder.com/150';
        selectedLabels[currentIndex].nameInput.value = name;
        const event = new Event('input');
        selectedLabels[currentIndex].nameInput.dispatchEvent(event);
    }
    
    currentIndex++;
}

function updateImageByUrl(index, url) {
    if (selectedLabels[index]) {
        selectedLabels[index].imgElement.src = url.trim() || 'https://via.placeholder.com/150';
    }
}

function updateQRCode(index, text) {
    if (!text.trim()) return;
    
    const qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    
    if (selectedLabels[index]) {
        selectedLabels[index].qrImg.src = qr.createDataURL(4, 0);
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear etiquetas iniciales
    createInitialLabels();

    // Event Listeners
    document.getElementById('searchButton').addEventListener('click', buscarProductos);
    document.getElementById('searchInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') buscarProductos();
    });

    // URLs para imágenes
    document.querySelectorAll('.url-input').forEach((input, index) => {
        input.addEventListener('input', (e) => {
            updateImageByUrl(index, e.target.value);
        });
    });

    // Códigos QR
    document.querySelectorAll('.code-input').forEach((input, index) => {
        input.addEventListener('input', (e) => {
            updateQRCode(index, e.target.value);
        });
    });

    // Botón de imprimir
    document.getElementById('printButton').addEventListener('click', () => {
        window.print();
    });
});
