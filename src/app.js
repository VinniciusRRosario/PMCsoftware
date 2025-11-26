import { supabase } from './supabaseClient.js';
import { checkSession, logout } from './auth.js';
import { createIcons, icons } from 'lucide';

// --- Global & Init ---
async function init() {
    await checkSession();
    createIcons({ icons });
    setupNavigation();

    const path = window.location.pathname;
    if (path.includes('inventory.html')) initInventory();
    else if (path.includes('clients.html')) initClients();
    else if (path.includes('orders.html')) initOrders();
    else if (path.includes('order-details.html')) initOrderDetails();
    else if (path.includes('index.html') || path === '/') initDashboard();
}

function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (hamburger) hamburger.addEventListener('click', () => { nav.classList.add('active'); overlay.classList.add('active'); });
    if (overlay) overlay.addEventListener('click', () => { nav.classList.remove('active'); overlay.classList.remove('active'); });
    if (logoutBtn) logoutBtn.addEventListener('click', async (e) => { e.preventDefault(); await logout(); });
}

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR');

// --- Inventory ---
async function initInventory() {
    const listContainer = document.getElementById('inventory-list');
    const tableBody = document.getElementById('inventory-table-body');
    const categoryFilter = document.getElementById('category-filter');
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCountEl = document.getElementById('selected-count');
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    
    let allProducts = [];
    let selectedProducts = new Set();

    async function loadProducts() {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) return;
        allProducts = data;
        
        const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
        if (categoryFilter) {
            const current = categoryFilter.value;
            categoryFilter.innerHTML = `<option value="all">Todas as Categorias</option>` + 
                categories.map(c => `<option value="${c}">${c}</option>`).join('');
            categoryFilter.value = current;
        }
        
        renderProducts();
    }

    function renderProducts() {
        const cat = categoryFilter ? categoryFilter.value : 'all';
        const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);

        // Mobile List
        listContainer.innerHTML = filtered.map(p => `
            <div class="card flex" style="align-items: flex-start; gap: 10px;">
                <div style="padding-top: 4px;">
                    <input type="checkbox" class="prod-checkbox" value="${p.id}" style="width:20px; height:20px; cursor:pointer" ${selectedProducts.has(p.id) ? 'checked' : ''}>
                </div>
                <div style="flex: 1;">
                    <div class="card-header">
                        <h3>${p.name}</h3>
                        <span class="status-badge ${p.current_stock < 10 ? 'urgent' : 'status-concluido'}">${p.current_stock} un</span>
                    </div>
                    <p class="text-muted">${p.category || 'Sem categoria'}</p>
                    <p class="font-bold text-primary">${formatCurrency(p.unit_price)}</p>
                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-primary btn-sm w-full" onclick="window.openStockModal('${p.id}', '${p.name}')">Ajustar Estoque</button>
                        <button class="btn btn-outline btn-sm" onclick="window.openProductModal('${p.id}', '${p.name}', '${p.category||''}', ${p.unit_price})"><i data-lucide="edit"></i></button>
                        <button class="btn btn-outline btn-sm text-danger" onclick="window.deleteProduct('${p.id}')"><i data-lucide="trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        // Desktop Table
        if (tableBody) {
            tableBody.innerHTML = filtered.map(p => `
                <tr>
                    <td><input type="checkbox" class="prod-checkbox" value="${p.id}" style="width:18px; height:18px; cursor:pointer" ${selectedProducts.has(p.id) ? 'checked' : ''}></td>
                    <td>${p.name}</td>
                    <td>${p.category || '-'}</td>
                    <td>${formatCurrency(p.unit_price)}</td>
                    <td class="${p.current_stock < 10 ? 'text-danger' : 'text-success'} font-bold">${p.current_stock}</td>
                    <td>
                        <div class="flex gap-2">
                            <button class="btn btn-primary btn-sm" onclick="window.openStockModal('${p.id}', '${p.name}')">Ajustar</button>
                            <button class="btn btn-outline btn-sm" onclick="window.openProductModal('${p.id}', '${p.name}', '${p.category||''}', ${p.unit_price})">Editar</button>
                            <button class="btn btn-outline btn-sm text-danger" onclick="window.deleteProduct('${p.id}')"><i data-lucide="trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        createIcons({ icons });
        attachCheckboxListeners();
    }

    function attachCheckboxListeners() {
        document.querySelectorAll('.prod-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if(e.target.checked) selectedProducts.add(e.target.value);
                else selectedProducts.delete(e.target.value);
                updateBulkActions();
            });
        });
    }

    function updateBulkActions() {
        if(selectedProducts.size > 0) {
            bulkActions.classList.remove('hidden');
            selectedCountEl.innerText = `${selectedProducts.size} selecionado(s)`;
        } else {
            bulkActions.classList.add('hidden');
        }
    }

    btnDeleteSelected.addEventListener('click', async () => {
        if(!confirm(`Tem certeza que deseja excluir ${selectedProducts.size} produto(s)?`)) return;
        
        const ids = Array.from(selectedProducts);
        // Verifica se há produtos em pedidos (opcional, mas seguro)
        // Aqui vamos tentar deletar direto. Se tiver FK constraint, o Supabase vai retornar erro.
        
        const { error } = await supabase.from('products').delete().in('id', ids);
        
        if(error) {
            console.error(error);
            alert('Erro ao excluir. Verifique se os produtos estão em uso em algum pedido.');
        } else {
            selectedProducts.clear();
            updateBulkActions();
            loadProducts();
        }
    });

    window.deleteProduct = async (id) => {
        if(!confirm('Tem certeza que deseja excluir este produto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if(error) alert('Erro ao excluir. O produto pode estar vinculado a um pedido.');
        else loadProducts();
    };

    if (categoryFilter) categoryFilter.addEventListener('change', renderProducts);

    window.openStockModal = (id, name) => {
        document.getElementById('modal-product-name').innerText = name;
        document.getElementById('stock-modal').dataset.pid = id;
        document.getElementById('stock-modal').classList.add('active');
    };

    document.getElementById('stock-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pid = document.getElementById('stock-modal').dataset.pid;
        const amount = parseInt(document.getElementById('stock-amount').value);
        const type = document.getElementById('stock-type').value;
        
        const { data: prod } = await supabase.from('products').select('current_stock').eq('id', pid).single();
        const newStock = prod.current_stock + (type === 'add' ? amount : -amount);
        
        await supabase.from('products').update({ current_stock: newStock }).eq('id', pid);
        document.getElementById('stock-modal').classList.remove('active');
        loadProducts();
        e.target.reset();
    });

    window.openProductModal = (id=null, name='', cat='', price='') => {
        const modal = document.getElementById('product-modal');
        modal.dataset.pid = id || '';
        document.getElementById('product-modal-title').innerText = id ? 'Editar Produto' : 'Novo Produto';
        document.getElementById('prod-name').value = name;
        document.getElementById('prod-category').value = cat;
        document.getElementById('prod-price').value = price;
        modal.classList.add('active');
    };

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pid = document.getElementById('product-modal').dataset.pid;
        const data = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            unit_price: parseFloat(document.getElementById('prod-price').value)
        };

        if (pid) await supabase.from('products').update(data).eq('id', pid);
        else await supabase.from('products').insert([{ ...data, current_stock: 0 }]);

        document.getElementById('product-modal').classList.remove('active');
        loadProducts();
        e.target.reset();
    });

    window.closeModal = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    loadProducts();
}

// --- Clients ---
async function initClients() {
    const container = document.getElementById('clients-list');
    const searchInput = document.getElementById('search-client');
    const editModal = document.getElementById('edit-client-modal');
    let currentClientId = null;
    
    async function loadClients(q='') {
        let query = supabase.from('clients').select('*').order('name');
        if(q) query = query.ilike('name', `%${q}%`);
        const { data } = await query;
        
        container.innerHTML = data.map(c => `
            <div class="card">
                <div class="card-header">
                    <h3>${c.name}</h3>
                    <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick="window.openEditClient('${c.id}', '${c.name}', '${c.company_name||''}', '${c.phone||''}', '${c.address||''}')">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="window.deleteClient('${c.id}')">
                            <i data-lucide="trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-muted">${c.company_name || 'Pessoa Física'}</p>
                <p><i data-lucide="phone" style="width:14px"></i> ${c.phone}</p>
                <p class="text-sm text-muted mt-1">${c.address || 'Sem endereço'}</p>
            </div>
        `).join('');
        createIcons({ icons });
    }

    document.getElementById('client-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await supabase.from('clients').insert([Object.fromEntries(formData)]);
        e.target.reset();
        loadClients();
    });

    window.openEditClient = (id, name, company, phone, address) => {
        currentClientId = id;
        document.getElementById('edit-name').value = name;
        document.getElementById('edit-company').value = company;
        document.getElementById('edit-phone').value = phone;
        document.getElementById('edit-address').value = address;
        editModal.classList.add('active');
    };

    document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = {
            name: document.getElementById('edit-name').value,
            company_name: document.getElementById('edit-company').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value
        };
        
        const { error } = await supabase.from('clients').update(updates).eq('id', currentClientId);
        if (!error) {
            editModal.classList.remove('active');
            loadClients();
        } else {
            alert('Erro ao atualizar cliente.');
        }
    });

    window.closeClientModal = () => editModal.classList.remove('active');
    searchInput.addEventListener('input', (e) => loadClients(e.target.value));
    window.deleteClient = async (id) => { if(confirm('Excluir?')) { await supabase.from('clients').delete().eq('id', id); loadClients(); }};
    loadClients();
}

// --- Orders (Com Seleção e Exclusão em Massa) ---
async function initOrders() {
    const listContainer = document.getElementById('orders-list');
    const tabActive = document.getElementById('tab-active');
    const tabHistory = document.getElementById('tab-history');
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCountEl = document.getElementById('selected-count');
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    
    let statusFilter = ['pendente', 'em_andamento'];
    let selectedOrders = new Set();

    async function loadOrders() {
        let q = supabase.from('orders').select('*, clients(name)').order('delivery_deadline');
        if (statusFilter.includes('concluido')) q = q.eq('status', 'concluido');
        else q = q.in('status', ['pendente', 'em_andamento']);

        const { data: orders } = await q;
        if (!orders) return;

        const orderIds = orders.map(o => o.id);
        let items = [];
        if(orderIds.length) {
            const { data } = await supabase.from('order_items').select('*').in('order_id', orderIds);
            items = data;
        }
        
        const isHistory = statusFilter.includes('concluido');

        listContainer.innerHTML = orders.map(o => {
            const myItems = items.filter(i => i.order_id === o.id);
            const totalOrdered = myItems.reduce((sum, i) => sum + i.qty_ordered, 0);
            const totalDelivered = myItems.reduce((sum, i) => sum + i.qty_delivered, 0);
            const percent = totalOrdered ? Math.round((totalDelivered/totalOrdered)*100) : 0;
            
            const subtotal = myItems.reduce((sum, i) => sum + (i.qty_ordered * (i.unit_price || 0)), 0);
            const discount = o.discount_type === 'percent' ? (subtotal * (o.discount_value/100)) : o.discount_value;
            const total = subtotal - discount;

            // Checkbox apenas no histórico
            const checkboxHTML = isHistory ? 
                `<div onclick="event.stopPropagation()" style="margin-right:12px; display:flex; align-items:center;">
                    <input type="checkbox" class="order-checkbox" value="${o.id}" style="width:20px; height:20px; cursor:pointer" ${selectedOrders.has(o.id) ? 'checked' : ''}>
                 </div>` : '';

            return `
            <div class="card flex" onclick="window.location.href='order-details.html?id=${o.id}'" style="cursor:pointer; border-left: 4px solid var(--primary); align-items: stretch;">
                ${checkboxHTML}
                <div style="flex:1">
                    <div class="card-header">
                        <h3>${o.clients?.name || 'Cliente Removido'}</h3>
                        <span class="status-badge status-${o.status}">${o.status.replace('_', ' ')}</span>
                    </div>
                    <div class="flex justify-between text-sm text-muted mb-4">
                        <span>Prazo: ${formatDate(o.delivery_deadline)}</span>
                        <span>Total: ${formatCurrency(total)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, percent)}%"></div>
                    </div>
                    <p class="text-right text-sm mt-2">${percent > 100 ? 100 : percent}% Produzido</p>
                </div>
            </div>
            `;
        }).join('');

        // Re-attach event listeners for checkboxes
        if(isHistory) {
            document.querySelectorAll('.order-checkbox').forEach(cb => {
                cb.addEventListener('click', (e) => e.stopPropagation()); // Prevent card click
                cb.addEventListener('change', (e) => {
                    if(e.target.checked) selectedOrders.add(e.target.value);
                    else selectedOrders.delete(e.target.value);
                    updateBulkActions();
                });
            });
        }
    }

    function updateBulkActions() {
        if(selectedOrders.size > 0) {
            bulkActions.classList.remove('hidden');
            selectedCountEl.innerText = `${selectedOrders.size} selecionado(s)`;
        } else {
            bulkActions.classList.add('hidden');
        }
    }

    btnDeleteSelected.addEventListener('click', async () => {
        if(!confirm(`Tem certeza que deseja apagar ${selectedOrders.size} pedido(s)? O histórico será perdido permanentemente.`)) return;
        
        const ids = Array.from(selectedOrders);
        // Primeiro apagar itens dos pedidos (caso não tenha cascade)
        await supabase.from('order_items').delete().in('order_id', ids);
        // Depois apagar os pedidos
        const { error } = await supabase.from('orders').delete().in('id', ids);
        
        if(!error) {
            selectedOrders.clear();
            updateBulkActions();
            loadOrders();
        } else {
            alert('Erro ao apagar pedidos.');
        }
    });

    tabActive.addEventListener('click', () => { 
        statusFilter = ['pendente', 'em_andamento']; 
        selectedOrders.clear(); updateBulkActions();
        tabActive.className = 'btn btn-primary w-full'; tabHistory.className = 'btn btn-outline w-full';
        loadOrders(); 
    });
    tabHistory.addEventListener('click', () => { 
        statusFilter = ['concluido']; 
        tabHistory.className = 'btn btn-primary w-full'; tabActive.className = 'btn btn-outline w-full';
        loadOrders(); 
    });

    setupNewOrderModal();
    loadOrders();
}

async function setupNewOrderModal() {
    const modal = document.getElementById('new-order-modal');
    const clientSelect = document.getElementById('order-client-select');
    const productSelect = document.getElementById('order-product-select');
    const itemsList = document.getElementById('order-items-list');
    const toggleClientBtn = document.getElementById('toggle-new-client');
    const existingClientDiv = document.getElementById('existing-client-div');
    const newClientDiv = document.getElementById('new-client-div');
    let isNewClientMode = false;

    const discountType = document.getElementById('discount-type');
    const discountValue = document.getElementById('discount-value');
    const subtotalEl = document.getElementById('calc-subtotal');
    const discountEl = document.getElementById('calc-discount');
    const totalEl = document.getElementById('calc-total');

    let cart = [];
    let productsCache = [];

    const { data: clients } = await supabase.from('clients').select('id, name');
    const { data: products } = await supabase.from('products').select('id, name, unit_price');
    productsCache = products || [];

    if (clientSelect && clients) clientSelect.innerHTML += clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (productSelect && products) productSelect.innerHTML += products.map(p => `<option value="${p.id}">${p.name} - ${formatCurrency(p.unit_price)}</option>`).join('');

    toggleClientBtn.addEventListener('click', () => {
        isNewClientMode = !isNewClientMode;
        if (isNewClientMode) {
            existingClientDiv.classList.add('hidden');
            newClientDiv.classList.remove('hidden');
            toggleClientBtn.innerText = 'Selecionar Cliente Existente';
        } else {
            existingClientDiv.classList.remove('hidden');
            newClientDiv.classList.add('hidden');
            toggleClientBtn.innerText = 'Cadastrar Novo Cliente';
        }
    });

    window.addItemToOrder = () => {
        const pid = productSelect.value;
        const qty = parseInt(document.getElementById('order-qty').value);
        if (!pid || !qty) return;
        
        const prod = productsCache.find(p => p.id === pid);
        cart.push({ ...prod, qty });
        renderCart();
        updateFinancials();
    };

    window.removeItem = (idx) => { cart.splice(idx, 1); renderCart(); updateFinancials(); };

    function renderCart() {
        itemsList.innerHTML = cart.map((item, idx) => `
            <div class="flex justify-between items-center" style="background:var(--surface-hover); padding:8px; margin-bottom:4px; border-radius:4px;">
                <span>${item.name} (x${item.qty})</span>
                <div class="flex items-center gap-2">
                    <span>${formatCurrency(item.unit_price * item.qty)}</span>
                    <button type="button" class="text-danger" onclick="window.removeItem(${idx})">X</button>
                </div>
            </div>
        `).join('');
    }

    function updateFinancials() {
        const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
        const type = discountType.value;
        const val = parseFloat(discountValue.value) || 0;
        
        let discount = 0;
        if (type === 'percent') discount = subtotal * (val / 100);
        else discount = val;

        const total = Math.max(0, subtotal - discount);

        subtotalEl.innerText = formatCurrency(subtotal);
        discountEl.innerText = `- ${formatCurrency(discount)}`;
        totalEl.innerText = formatCurrency(total);
    }

    discountType.addEventListener('change', updateFinancials);
    discountValue.addEventListener('input', updateFinancials);

    document.getElementById('create-order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert('Adicione itens ao pedido');

        let clientId = clientSelect.value;

        if (isNewClientMode) {
            const name = document.getElementById('new-client-name').value;
            const phone = document.getElementById('new-client-phone').value;
            if (!name || !phone) return alert('Preencha nome e telefone do cliente');

            const { data: newClient, error } = await supabase.from('clients').insert([{ name, phone }]).select().single();
            if (error) return alert('Erro ao criar cliente');
            clientId = newClient.id;
        } else if (!clientId) {
            return alert('Selecione um cliente');
        }

        const { data: order, error } = await supabase.from('orders').insert([{
            client_id: clientId,
            delivery_deadline: document.getElementById('order-deadline').value,
            status: 'pendente',
            discount_type: discountType.value,
            discount_value: parseFloat(discountValue.value) || 0
        }]).select().single();

        if (error) return alert('Erro ao criar pedido');

        const items = cart.map(i => ({
            order_id: order.id,
            product_id: i.id,
            qty_ordered: i.qty,
            unit_price: i.unit_price
        }));
        await supabase.from('order_items').insert(items);

        window.location.reload();
    });

    window.openNewOrderModal = () => modal.classList.add('active');
    window.closeNewOrderModal = () => modal.classList.remove('active');
}

// --- Order Details (Updated Info) ---
async function initOrderDetails() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    if (!orderId) return window.location.href = 'orders.html';

    const headerEl = document.getElementById('order-header');
    const itemsEl = document.getElementById('order-items-detail');
    const financialEl = document.getElementById('order-financial');
    const actionsEl = document.getElementById('order-actions');

    async function loadDetails() {
        const { data: order } = await supabase.from('orders').select('*, clients(name)').eq('id', orderId).single();
        const { data: items } = await supabase.from('order_items').select('*, products(name, current_stock)').eq('order_id', orderId);

        // Header
        headerEl.innerHTML = `
            <h2>Pedido #${orderId.slice(0,6)}</h2>
            <p class="text-muted">Cliente: ${order.clients?.name}</p>
            <p>Prazo: ${formatDate(order.delivery_deadline)}</p>
            <span class="status-badge status-${order.status}">${order.status}</span>
        `;

        // Financial Summary
        const subtotal = items.reduce((sum, i) => sum + (i.qty_ordered * i.unit_price), 0);
        const discount = order.discount_type === 'percent' ? (subtotal * (order.discount_value/100)) : order.discount_value;
        const total = subtotal - discount;

        financialEl.innerHTML = `
            <div class="fin-row"><span>Subtotal</span> <span>${formatCurrency(subtotal)}</span></div>
            <div class="fin-row"><span>Desconto (${order.discount_type === 'percent' ? order.discount_value+'%' : 'Fixo'})</span> <span>- ${formatCurrency(discount)}</span></div>
            <div class="fin-total"><span>Total</span> <span>${formatCurrency(total)}</span></div>
        `;

        // Items & Production
        let allComplete = true;
        
        itemsEl.innerHTML = items.map(item => {
            const remaining = item.qty_ordered - item.qty_delivered;
            const isComplete = remaining <= 0;
            if (remaining > 0) allComplete = false;
            
            const progress = Math.min(100, Math.round((item.qty_delivered / item.qty_ordered) * 100));
            
            // Texto de status (Faltam X ou Excedente Y)
            let statusText = '';
            let statusColor = 'text-muted';
            
            if (remaining > 0) {
                statusText = `Faltam: ${remaining}`;
                statusColor = 'text-warning';
            } else if (remaining < 0) {
                statusText = `Excedente: +${Math.abs(remaining)}`;
                statusColor = 'text-primary';
            } else {
                statusText = 'Concluído';
                statusColor = 'text-success';
            }

            return `
            <div class="card">
                <div class="flex justify-between mb-2">
                    <h4>${item.products.name}</h4>
                    <div class="text-right">
                        <!-- Updated Display Format: X / Y (Faltam Z) -->
                        <span class="font-bold">${item.qty_delivered} / ${item.qty_ordered}</span>
                        <div class="text-sm ${statusColor}">${remaining > 0 ? `(Faltam ${remaining})` : statusText}</div>
                    </div>
                </div>
                <div class="progress-bar mb-4">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                
                <div class="flex gap-2 items-center" style="background:var(--surface-hover); padding:10px; border-radius:var(--radius)">
                    <div style="flex:1">
                        <label class="text-sm">Adicionar Produção</label>
                        <input type="number" id="input-${item.id}" placeholder="Qtd" style="margin:0">
                    </div>
                    <button class="btn btn-primary" style="height:42px; margin-top:18px" 
                        onclick="window.updateProduction('${item.id}', ${item.qty_delivered}, ${item.qty_ordered}, '${item.product_id}')">
                        Confirmar
                    </button>
                </div>
                <p class="text-sm text-muted mt-2">Estoque Atual: ${item.products.current_stock} un</p>
            </div>
            `;
        }).join('');
        createIcons({ icons });

        // Actions Logic
        let actionsHTML = '';

        if (order.status !== 'concluido') {
            actionsHTML += `
                <div class="card" style="border-color: var(--success)">
                    <h3>Finalizar Pedido</h3>
                    <p class="text-muted text-sm mb-4">
                        Ao finalizar, o sistema irá considerar que <strong>todos os itens restantes</strong> foram produzidos e entregues, descontando-os do estoque automaticamente.
                    </p>
                    <button class="btn btn-success w-full" onclick="window.forceFinishOrder()">
                        <i data-lucide="check-circle-2"></i> Concluir Pedido Agora
                    </button>
                </div>
            `;
        } else {
            actionsHTML = '<p class="text-center text-success font-bold text-lg"><i data-lucide="check-circle"></i> Pedido Finalizado e Arquivado.</p>';
        }
        
        actionsEl.innerHTML = actionsHTML;
        createIcons({ icons });
    }

    window.updateProduction = async (itemId, currentDelivered, maxOrdered, productId) => {
        const input = document.getElementById(`input-${itemId}`);
        const qtyToAdd = parseInt(input.value);
        
        if (!qtyToAdd || qtyToAdd <= 0) return alert('Digite uma quantidade válida');
        
        if ((currentDelivered + qtyToAdd) > maxOrdered) {
            if(!confirm(`Atenção: Isso fará com que a entrega (${currentDelivered + qtyToAdd}) seja maior que o pedido (${maxOrdered}). Deseja continuar?`)) return;
        }

        const { error: errItem } = await supabase.from('order_items')
            .update({ qty_delivered: currentDelivered + qtyToAdd })
            .eq('id', itemId);
        
        if (errItem) return alert('Erro ao atualizar pedido');

        const { data: prod } = await supabase.from('products').select('current_stock').eq('id', productId).single();
        if (prod) {
            await supabase.from('products')
                .update({ current_stock: prod.current_stock - qtyToAdd })
                .eq('id', productId);
        }

        await supabase.from('orders').update({ status: 'em_andamento' }).eq('id', orderId).eq('status', 'pendente');

        loadDetails();
    };

    window.forceFinishOrder = async () => {
        if(!confirm('Tem certeza? O sistema irá baixar do estoque todos os itens que FALTAM e marcar o pedido como concluído.')) return;

        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
        
        for (const item of items) {
            const remaining = item.qty_ordered - item.qty_delivered;
            
            if (remaining > 0) {
                await supabase.from('order_items').update({ qty_delivered: item.qty_ordered }).eq('id', item.id);
                
                const { data: prod } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single();
                if (prod) {
                    await supabase.from('products').update({ current_stock: prod.current_stock - remaining }).eq('id', item.product_id);
                }
            }
        }

        await supabase.from('orders').update({ status: 'concluido' }).eq('id', orderId);
        loadDetails();
    };

    loadDetails();
}

// --- Dashboard ---
async function initDashboard() {
    const { count: pending } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pendente');
    const { count: active } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento');
    const { count: lowStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('current_stock', 10);

    const { data: completedOrders } = await supabase.from('orders').select('*').eq('status', 'concluido');
    let revenue = 0;

    if (completedOrders && completedOrders.length > 0) {
        const orderIds = completedOrders.map(o => o.id);
        const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds);
        
        completedOrders.forEach(order => {
            const myItems = items.filter(i => i.order_id === order.id);
            const subtotal = myItems.reduce((sum, i) => sum + (i.qty_ordered * (i.unit_price || 0)), 0);
            const discount = order.discount_type === 'percent' ? (subtotal * (order.discount_value/100)) : order.discount_value;
            revenue += (subtotal - discount);
        });
    }

    document.getElementById('dash-stats').innerHTML = `
        <div class="card">
            <h3>Pendentes</h3>
            <p class="text-danger text-lg font-bold">${pending||0}</p>
        </div>
        <div class="card">
            <h3>Em Produção</h3>
            <p class="text-primary text-lg font-bold">${active||0}</p>
        </div>
        <div class="card">
            <h3>Estoque Baixo</h3>
            <p class="text-warning text-lg font-bold">${lowStock||0}</p>
        </div>
        <div class="card" style="border-color: var(--success)">
            <h3>Faturamento</h3>
            <p class="text-success text-lg font-bold">${formatCurrency(revenue)}</p>
            <p class="text-muted text-sm">Pedidos Concluídos</p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', init);
