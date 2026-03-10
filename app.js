// Initialize Dexie.js Database
const db = new Dexie("ClothingStoreDB");
db.version(1).stores({
    products: "++id, name, barcode, category, costPrice, retailPrice, wholesalePrice, stockCount, type",
    sales: "++id, date, totalAmount, profit, discount, paymentMethod",
    // Intentionally keeping items outside indexed keys, we'll store as stringified JSON in the record 
    suppliers: "++id, name, contact"
});

// App State
const state = {
    cart: [],
    pricingMode: 'retail', // 'retail' or 'wholesale'
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 0,
    paymentMethod: 'Cash',
    currentCategory: 'All'
};

// Utilities & Init
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);

    // Initial renders
    seedDefaultData().then(() => {
        renderInventory();
        renderSuppliers();
        renderPOSGrid();
        generateReport();
    });

    // Barcode Scanner Listener in POS
    document.getElementById('barcode-search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleBarcodeScan(this.value);
            this.value = '';
        }
    });

    document.getElementById('barcode-search').addEventListener('input', function (e) {
        renderPOSGrid(this.value);
    });
});

async function seedDefaultData() {
    const count = await db.products.count();
    if (count === 0) {
        await db.products.bulkAdd([
            { name: "Premium Cotton T-Shirt (Black)", barcode: "100000000001", category: "Menswear", costPrice: 800, retailPrice: 1500, wholesalePrice: 1300, stockCount: 50, type: "Vendor" },
            { name: "Ladies Floral Summer Dress", barcode: "100000000002", category: "Ladies", costPrice: 1500, retailPrice: 2800, wholesalePrice: 2500, stockCount: 30, type: "In-house" },
            { name: "Kids Denim Shorts Basic", barcode: "100000000003", category: "Kids", costPrice: 600, retailPrice: 1200, wholesalePrice: 1000, stockCount: 20, type: "Vendor" },
            { name: "Mens Casual Formal Shirt", barcode: "100000000004", category: "Menswear", costPrice: 1200, retailPrice: 2200, wholesalePrice: 2000, stockCount: 15, type: "In-house" },
            { name: "Ladies Office Blouse White", barcode: "100000000005", category: "Ladies", costPrice: 1000, retailPrice: 1800, wholesalePrice: 1600, stockCount: 40, type: "Vendor" }
        ]);
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', { hour12: true });
}

// Navigation Logic
function navigate(viewId) {
    // Buttons Active State
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-target="${viewId}"]`).classList.add('active');

    // View Switching
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none'; // Ensure CSS transitions work
    });

    const target = document.getElementById(`view-${viewId}`);
    target.style.display = 'flex';
    setTimeout(() => target.classList.add('active'), 50);

    // Title mapping
    const titles = {
        'pos': 'Point of Sale',
        'inventory': 'Inventory Management',
        'suppliers': 'Vendor Management',
        'reports': 'Business Reports & Analytics'
    };
    document.getElementById('page-title').textContent = titles[viewId];

    // Refresh data on navigate
    if (viewId === 'inventory') renderInventory();
    if (viewId === 'suppliers') renderSuppliers();
    if (viewId === 'reports') generateReport();
    if (viewId === 'pos') renderPOSGrid();
}

// Modal Logic
function openProductModal(id = null) {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add New Product';

    if (id) {
        db.products.get(Number(id)).then(prod => {
            document.getElementById('product-modal-title').textContent = 'Edit Product';
            document.getElementById('prod-id').value = prod.id;
            document.getElementById('prod-name').value = prod.name;
            document.getElementById('prod-barcode').value = prod.barcode;
            document.getElementById('prod-category').value = prod.category;
            document.getElementById('prod-type').value = prod.type;
            document.getElementById('prod-cost').value = prod.costPrice;
            document.getElementById('prod-retail').value = prod.retailPrice;
            document.getElementById('prod-wholesale').value = prod.wholesalePrice;
            document.getElementById('prod-stock').value = prod.stockCount;
        });
    }

    document.getElementById('modal-product').classList.add('open');
}

function openSupplierModal(id = null) {
    document.getElementById('supplier-form').reset();
    document.getElementById('sup-id').value = '';
    document.getElementById('supplier-modal-title').textContent = 'Add New Supplier';

    if (id) {
        db.suppliers.get(Number(id)).then(sup => {
            document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
            document.getElementById('sup-id').value = sup.id;
            document.getElementById('sup-name').value = sup.name;
            document.getElementById('sup-contact').value = sup.contact;
        });
    }
    document.getElementById('modal-supplier').classList.add('open');
}

function openPaymentModal() {
    if (state.cart.length === 0) return;
    document.getElementById('pay-amount').textContent = calculateTotal();
    document.getElementById('cash-given').value = '';
    document.getElementById('cash-change').textContent = '0.00';
    document.getElementById('modal-payment').classList.add('open');
}

function openDiscountModal() {
    if (state.cart.length === 0) return;
    document.getElementById('modal-discount').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// Helpers
function generateRandomBarcode() {
    const code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    document.getElementById('prod-barcode').value = code;
}

// ------------------- INVENTORY MANAGEMENT ------------------- //
async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;

    const product = {
        name: document.getElementById('prod-name').value,
        barcode: document.getElementById('prod-barcode').value,
        category: document.getElementById('prod-category').value,
        type: document.getElementById('prod-type').value,
        costPrice: parseFloat(document.getElementById('prod-cost').value),
        retailPrice: parseFloat(document.getElementById('prod-retail').value),
        wholesalePrice: parseFloat(document.getElementById('prod-wholesale').value),
        stockCount: parseInt(document.getElementById('prod-stock').value)
    };

    try {
        if (id) {
            await db.products.update(Number(id), product);
            Swal.fire({ icon: 'success', title: 'Product Updated', timer: 1500, showConfirmButton: false });
        } else {
            // check barcode duplicate
            const exist = await db.products.where('barcode').equals(product.barcode).first();
            if (exist) {
                Swal.fire({ icon: 'error', title: 'Barcode already exists!', text: 'Please use a unique barcode.' });
                return;
            }
            await db.products.add(product);
            Swal.fire({ icon: 'success', title: 'Product Added', timer: 1500, showConfirmButton: false });
        }
        closeModal('modal-product');
        renderInventory();
        renderPOSGrid();
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Something went wrong!' });
    }
}

async function renderInventory() {
    const search = document.getElementById('inventory-search').value.toLowerCase();
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    const products = await db.products.toArray();

    products.filter(p => p.name.toLowerCase().includes(search) || p.barcode.includes(search)).forEach(p => {
        const tr = document.createElement('tr');

        // Low stock warning style
        const stockStyle = p.stockCount <= 5 ? 'text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md' : 'text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md';

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-bold text-slate-800">${p.name}</div>
                <div class="text-xs text-slate-500"><i class="fa-solid fa-barcode mr-1"></i>${p.barcode}</div>
            </td>
            <td class="px-6 py-4">
                <span class="bg-indigo-50 text-primary text-xs font-semibold px-2 py-1 rounded">${p.category}</span>
            </td>
            <td class="px-6 py-4 text-xs font-medium text-slate-500">${p.type}</td>
            <td class="px-6 py-4 text-right">Rs. ${p.costPrice.toFixed(2)}</td>
            <td class="px-6 py-4 text-right font-medium">Rs. ${p.retailPrice.toFixed(2)}</td>
            <td class="px-6 py-4 text-right font-medium">Rs. ${p.wholesalePrice.toFixed(2)}</td>
            <td class="px-6 py-4 text-center">
                <span class="inline-block ${stockStyle}">${p.stockCount}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="openProductModal(${p.id})" class="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded transition-all"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-500 hover:bg-red-50 w-8 h-8 rounded transition-all"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        await db.products.delete(id);
        renderInventory();
        renderPOSGrid();
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
    }
}

// ------------------- SUPPLIER MANAGEMENT ------------------- //
async function saveSupplier(e) {
    e.preventDefault();
    const id = document.getElementById('sup-id').value;
    const supplier = {
        name: document.getElementById('sup-name').value,
        contact: document.getElementById('sup-contact').value
    };

    if (id) {
        await db.suppliers.update(Number(id), supplier);
        Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false });
    } else {
        await db.suppliers.add(supplier);
        Swal.fire({ icon: 'success', title: 'Added', timer: 1500, showConfirmButton: false });
    }
    closeModal('modal-supplier');
    renderSuppliers();
}

async function renderSuppliers() {
    const grid = document.getElementById('suppliers-grid');
    grid.innerHTML = '';
    const suppliers = await db.suppliers.toArray();

    suppliers.forEach(s => {
        grid.innerHTML += `
            <div class="border border-slate-200 rounded-xl p-5 hover:border-primary transition-all group bg-slate-50 relative">
                <div class="w-12 h-12 rounded-full bg-indigo-100 text-primary flex items-center justify-center text-xl font-bold mb-4 shadow-sm">
                    ${s.name.charAt(0).toUpperCase()}
                </div>
                <h4 class="font-bold text-slate-800 text-lg mb-1">${s.name}</h4>
                <p class="text-slate-500 text-sm flex items-center gap-2"><i class="fa-solid fa-phone text-xs"></i> ${s.contact}</p>
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="openSupplierModal(${s.id})" class="text-blue-500 hover:bg-blue-100 w-8 h-8 rounded transition-all"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteSupplier(${s.id})" class="text-red-500 hover:bg-red-100 w-8 h-8 rounded transition-all"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

async function deleteSupplier(id) {
    const result = await Swal.fire({
        title: 'Delete this vendor?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b'
    });
    if (result.isConfirmed) {
        await db.suppliers.delete(id);
        renderSuppliers();
    }
}


// ------------------- POS TERMINAL LOGIC ------------------- //

function filterProducts(cat) {
    state.currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md', 'shadow-indigo-200');
        btn.classList.add('bg-white', 'text-slate-600');
    });
    event.target.classList.remove('bg-white', 'text-slate-600');
    event.target.classList.add('active', 'bg-primary', 'text-white', 'shadow-md', 'shadow-indigo-200');
    renderPOSGrid();
}

async function renderPOSGrid(searchTerm = '') {
    const grid = document.getElementById('pos-products-grid');
    grid.innerHTML = '';

    let products = await db.products.toArray();

    // Filters
    if (state.currentCategory !== 'All') {
        products = products.filter(p => p.category === state.currentCategory);
    }
    if (searchTerm) {
        products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm));
    }

    products.forEach(p => {
        const outOfStock = p.stockCount <= 0;
        const price = state.pricingMode === 'retail' ? p.retailPrice : p.wholesalePrice;

        // Determine icon based on category
        let iconClass = 'fa-solid fa-shirt';
        let iconColor = 'text-primary bg-indigo-50';

        if (p.category === 'Ladies') {
            iconClass = 'fa-solid fa-person-dress';
            iconColor = 'text-pink-500 bg-pink-50';
        } else if (p.category === 'Menswear') {
            iconClass = 'fa-solid fa-shirt';
            iconColor = 'text-blue-500 bg-blue-50';
        } else if (p.category === 'Kids') {
            iconClass = 'fa-solid fa-child';
            iconColor = 'text-amber-500 bg-amber-50';
        } else {
            iconClass = 'fa-solid fa-tag';
            iconColor = 'text-slate-500 bg-slate-100';
        }

        grid.innerHTML += `
            <div onclick="${outOfStock ? '' : `addToCart(${p.id})`}" class="product-card border ${outOfStock ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' : 'border-slate-200 bg-white cursor-pointer'} rounded-2xl p-4 flex flex-col justify-between h-40">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-md ${iconColor} flex items-center justify-center text-[11px]">
                                <i class="${iconClass}"></i>
                            </div>
                            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">${p.category}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            ${p.stockCount <= 5 && !outOfStock ? `<span class="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Low: ${p.stockCount}</span>` : ''}
                            ${outOfStock ? `<span class="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">Out of Stock</span>` : ''}
                            ${p.stockCount > 5 ? `<span class="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Qty: ${p.stockCount}</span>` : ''}
                        </div>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm leading-snug line-clamp-2">${p.name}</h4>
                </div>
                <div class="mt-2 text-primary font-bold text-lg">
                    Rs. ${price.toFixed(2)}
                </div>
            </div>
        `;
    });
}

function setPricingMode(mode) {
    state.pricingMode = mode;

    document.getElementById('btn-retail-mode').className = `flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${mode === 'retail' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`;
    document.getElementById('btn-wholesale-mode').className = `flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${mode === 'wholesale' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`;

    renderPOSGrid();
    updateCartUI(); // Prices might change in cart
}

function setDiscountType(type) {
    state.discountType = type;
    document.getElementById('btn-disc-percent').className = `flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'percentage' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`;
    document.getElementById('btn-disc-fixed').className = `flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'fixed' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`;
}

function applyDiscount() {
    const val = parseFloat(document.getElementById('discount-value').value) || 0;
    state.discountValue = val;
    updateCartUI();
    closeModal('modal-discount');
}

async function handleBarcodeScan(barcode) {
    const product = await db.products.where('barcode').equals(barcode).first();
    if (product) {
        if (product.stockCount > 0) {
            addToCart(product.id, product);
            // Play a beep sound optionally here
        } else {
            Swal.fire({ icon: 'error', title: 'Out of Stock!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        }
    } else {
        Swal.fire({ icon: 'warning', title: 'Product Not Found', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
}

async function addToCart(id, productObj = null) {
    let product = productObj;
    if (!product) {
        product = await db.products.get(id);
    }

    const existingIndex = state.cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
        // limit by stock
        if (state.cart[existingIndex].qty < product.stockCount) {
            state.cart[existingIndex].qty += 1;
        } else {
            Swal.fire({ icon: 'error', title: 'Max stock limit reached', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            return;
        }
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            retailPrice: product.retailPrice,
            wholesalePrice: product.wholesalePrice,
            costPrice: product.costPrice,
            qty: 1,
            maxQty: product.stockCount
        });
    }
    updateCartUI();
}

function updateCartQty(id, change) {
    const index = state.cart.findIndex(i => i.id === id);
    if (index > -1) {
        const item = state.cart[index];
        const newQty = item.qty + change;
        if (newQty > 0 && newQty <= item.maxQty) {
            item.qty = newQty;
        } else if (newQty === 0) {
            state.cart.splice(index, 1);
        } else if (newQty > item.maxQty) {
            Swal.fire({ icon: 'error', title: 'No more stock', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    }
    updateCartUI();
}

function removeCartItem(id) {
    state.cart = state.cart.filter(item => item.id !== id);

    // reset discount if cart is empty
    if (state.cart.length === 0) {
        state.discountValue = 0;
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');

    document.getElementById('cart-item-count').textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);

    let subtotal = 0;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 gap-3" id="empty-cart-msg">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <i class="fa-solid fa-cart-arrow-down text-2xl"></i>
                </div>
                <p class="text-sm">Cart is empty</p>
            </div>
        `;
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkout-btn').classList.add('opacity-50');
    } else {
        document.getElementById('checkout-btn').disabled = false;
        document.getElementById('checkout-btn').classList.remove('opacity-50');

        let htmlContent = '';
        state.cart.forEach(item => {
            const price = state.pricingMode === 'retail' ? item.retailPrice : item.wholesalePrice;
            const lineTotal = price * item.qty;
            subtotal += lineTotal;

            htmlContent += `
                <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div class="flex-1">
                        <h5 class="text-sm font-bold text-slate-800 line-clamp-1">${item.name}</h5>
                        <div class="text-xs text-slate-500 font-medium mt-0.5">Rs. ${price.toFixed(2)}</div>
                    </div>
                    <div class="flex items-center gap-3 ml-2">
                        <div class="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button onclick="updateCartQty(${item.id}, -1)" class="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-primary"><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <span class="w-8 text-center text-sm font-bold text-slate-800">${item.qty}</span>
                            <button onclick="updateCartQty(${item.id}, 1)" class="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-primary"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                        <div class="w-24 text-right font-bold text-slate-800 text-sm">
                            Rs. ${lineTotal.toFixed(2)}
                        </div>
                        <button onclick="removeCartItem(${item.id})" class="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = htmlContent;
    }

    // Calculations
    document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);

    let discountAmt = 0;
    if (state.discountType === 'percentage') {
        discountAmt = subtotal * (state.discountValue / 100);
    } else {
        discountAmt = state.discountValue;
    }

    // Prevent negative total
    if (discountAmt > subtotal) discountAmt = subtotal;

    document.getElementById('cart-discount').textContent = discountAmt.toFixed(2);

    const finalTotal = subtotal - discountAmt;
    document.getElementById('cart-total').textContent = finalTotal.toFixed(2);
}

function calculateTotal() {
    const subtotalText = document.getElementById('cart-subtotal').textContent;
    const discountText = document.getElementById('cart-discount').textContent;
    return (parseFloat(subtotalText) - parseFloat(discountText)).toFixed(2);
}

// ------------------- PAYMENT & CHECKOUT ------------------- //
function selectPaymentMethod(method, btnEl) {
    state.paymentMethod = method;
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'bg-indigo-50', 'text-primary');
        btn.classList.add('border-slate-100', 'bg-white', 'text-slate-500');
    });
    btnEl.classList.remove('border-slate-100', 'bg-white', 'text-slate-500');
    btnEl.classList.add('active', 'border-primary', 'bg-indigo-50', 'text-primary');

    const cashCalc = document.getElementById('cash-calculator');
    if (method === 'Cash') {
        cashCalc.style.display = 'block';
    } else {
        cashCalc.style.display = 'none';
    }
}

function calculateChange() {
    const finalTotal = parseFloat(calculateTotal());
    const given = parseFloat(document.getElementById('cash-given').value) || 0;
    let change = given - finalTotal;
    if (change < 0) change = 0;
    document.getElementById('cash-change').textContent = change.toFixed(2);
}

async function processPayment() {
    const finalTotal = parseFloat(calculateTotal());

    if (state.paymentMethod === 'Cash') {
        const given = parseFloat(document.getElementById('cash-given').value) || 0;
        if (given < finalTotal) {
            Swal.fire({ icon: 'error', title: 'Insufficient Cash', text: 'Cash given is less than the total amount.' });
            return;
        }
    }

    // Calculate Profit
    let totalCost = 0;
    let itemsForDB = [];

    // Reduce Stock & calculate total cost
    for (const item of state.cart) {
        totalCost += (item.costPrice * item.qty);

        const price = state.pricingMode === 'retail' ? item.retailPrice : item.wholesalePrice;
        itemsForDB.push({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: price,
            lineTotal: price * item.qty
        });

        const prod = await db.products.get(item.id);
        if (prod) {
            await db.products.update(item.id, { stockCount: prod.stockCount - item.qty });
        }
    }

    const netProfit = finalTotal - totalCost;
    const invoiceDate = new Date();

    // Save to Sales DB
    const saleRecord = {
        date: invoiceDate.toISOString(),
        totalAmount: finalTotal,
        profit: netProfit,
        discount: parseFloat(document.getElementById('cart-discount').textContent),
        paymentMethod: state.paymentMethod,
        items: JSON.stringify(itemsForDB)
    };

    const saleId = await db.sales.add(saleRecord);

    // Close Modal
    closeModal('modal-payment');

    // Print Receipt
    await prepareAndPrintInvoice(saleId, saleRecord, itemsForDB, parseFloat(document.getElementById('cart-subtotal').textContent));

    // Clear Cart & UI
    state.cart = [];
    state.discountValue = 0;
    renderPOSGrid();
    updateCartUI();

    Swal.fire({ icon: 'success', title: 'Payment Successful', timer: 2000, showConfirmButton: false });
}

// ------------------- INVOICE PRINTING ------------------- //
async function prepareAndPrintInvoice(id, record, items, subtotal) {
    const dateObj = new Date(record.date);

    document.getElementById('inv-date').textContent = dateObj.toLocaleDateString();
    document.getElementById('inv-time').textContent = dateObj.toLocaleTimeString();
    document.getElementById('inv-id').textContent = `INV-${id.toString().padStart(6, '0')}`;
    document.getElementById('inv-mode').textContent = state.pricingMode.toUpperCase();

    const tbody = document.getElementById('inv-items');
    tbody.innerHTML = '';

    items.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td style="padding-bottom: 5px;">${item.name}</td>
                <td style="text-align: center; padding-bottom: 5px;">${item.qty}</td>
                <td style="text-align: right; padding-bottom: 5px;">${item.price.toFixed(2)}</td>
                <td style="text-align: right; padding-bottom: 5px;">${item.lineTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    document.getElementById('inv-subtotal').textContent = subtotal.toFixed(2);

    if (record.discount > 0) {
        document.getElementById('inv-discount-row').style.display = 'flex';
        document.getElementById('inv-discount').textContent = record.discount.toFixed(2);
    } else {
        document.getElementById('inv-discount-row').style.display = 'none';
    }

    document.getElementById('inv-total').textContent = record.totalAmount.toFixed(2);
    document.getElementById('inv-paymethod').textContent = record.paymentMethod;

    if (record.paymentMethod === 'Cash') {
        const given = parseFloat(document.getElementById('cash-given').value) || record.totalAmount;
        document.getElementById('inv-paid').textContent = given.toFixed(2);
        document.getElementById('inv-change-row').style.display = 'flex';
        document.getElementById('inv-change').textContent = (given - record.totalAmount).toFixed(2);
    } else {
        document.getElementById('inv-paid').textContent = record.totalAmount.toFixed(2);
        document.getElementById('inv-change-row').style.display = 'none';
    }

    // Unhide to print
    const printArea = document.getElementById('printable-invoice');
    printArea.classList.remove('hidden');

    // Using Print.js
    printJS({
        printable: 'printable-invoice',
        type: 'html',
        targetStyles: ['*'],
        documentTitle: `Receipt_INV_${id}`,
        onPrintDialogClose: () => {
            printArea.classList.add('hidden');
        }
    });
}

// ------------------- REPORTS ------------------- //
async function generateReport() {
    const filterDate = document.getElementById('filter-date').value;
    const tbody = document.getElementById('reports-tbody');
    tbody.innerHTML = '';

    let sales = await db.sales.toArray();

    // Sort descending
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by date if selected
    if (filterDate) {
        const fStr = new Date(filterDate).toDateString();
        sales = sales.filter(s => new Date(s.date).toDateString() === fStr);
    }

    let totSales = 0;
    let totProfit = 0;

    sales.forEach(s => {
        totSales += s.totalAmount;
        totProfit += s.profit;

        const parsedItems = JSON.parse(s.items);
        const totalItemsCount = parsedItems.reduce((acc, item) => acc + item.qty, 0);

        const dDate = new Date(s.date);

        const methBadge = s.paymentMethod === 'Cash' ? 'text-emerald-700 bg-emerald-100' : (s.paymentMethod === 'Card' ? 'text-blue-700 bg-blue-100' : 'text-amber-700 bg-amber-100');

        tbody.innerHTML += `
            <tr>
                <td class="px-6 py-4 font-bold text-slate-700">INV-${s.id.toString().padStart(6, '0')}</td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-800">${dDate.toLocaleDateString()}</div>
                    <div class="text-xs text-slate-500">${dDate.toLocaleTimeString()}</div>
                </td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-bold ${methBadge}">${s.paymentMethod}</span></td>
                <td class="px-6 py-4"><span class="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded">Mixed</span></td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${totalItemsCount}</td>
                <td class="px-6 py-4 text-right text-red-500 font-medium">Rs. ${s.discount.toFixed(2)}</td>
                <td class="px-6 py-4 text-right text-primary font-bold">Rs. ${s.totalAmount.toFixed(2)}</td>
                <td class="px-6 py-4 text-right text-emerald-600 font-bold">Rs. ${parseFloat(s.profit).toFixed(2)}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="reprintInvoice(${s.id})" class="text-slate-500 hover:text-primary transition-colors" title="Reprint Receipt"><i class="fa-solid fa-print"></i></button>
                </td>
            </tr>
        `;
    });

    document.getElementById('report-total-sales').textContent = totSales.toFixed(2);
    document.getElementById('report-total-profit').textContent = totProfit.toFixed(2);
    document.getElementById('report-total-orders').textContent = sales.length;
}

// Added reprint logic
async function reprintInvoice(id) {
    const record = await db.sales.get(Number(id));
    if (!record) return;
    const items = JSON.parse(record.items);

    const subtotal = record.totalAmount + record.discount;
    await prepareAndPrintInvoice(id, record, items, subtotal);
}
