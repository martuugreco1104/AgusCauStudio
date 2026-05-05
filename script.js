document.addEventListener('DOMContentLoaded', () => {
    // State
    let state = {
        profesional: null,
        cliente: '',
        servicio: '',
        precioTotal: 0,
        senaPagada: 0,
        metodoPago: null
    };

    let history = [];
    let serviciosList = ['Softgel', 'Kapping', 'Sculpted', 'Esmaltado', 'Lifting'];
    let editState = { servicio: '' };

    const supabaseUrl = 'https://honqcuantlkdxwwjhxmw.supabase.co/rest/v1';
    const supabaseKey = 'sb_publishable_QcL6c0517heNESp4SfREyQ_d7DliFAc';
    const supabaseHeaders = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    async function loadInitialData() {
        try {
            const hRes = await fetch(`${supabaseUrl}/aguscau_history?select=*&order=fecha.desc`, { headers: supabaseHeaders });
            if (hRes.ok) {
                const data = await hRes.json();
                if (data && data.length > 0) {
                    history = data.map(row => ({
                        id: row.id,
                        fecha: row.fecha,
                        empleado: row.staff,
                        clienta: row.clienta,
                        servicio: row.servicio,
                        total: row.total,
                        sena: row.seña,
                        cobrar: row.cobro,
                        pago: row.pago,
                        foto: row.foto
                    }));
                }
            }
            
            const sRes = await fetch(`${supabaseUrl}/aguscau_servicios?select=*`, { headers: supabaseHeaders });
            if (sRes.ok) {
                const sData = await sRes.json();
                if (sData && sData.length > 0) serviciosList = sData.map(s => s.nombre);
            }
        } catch (e) {
            console.error('Error fetching Supabase data:', e);
        }
        renderServiciosButtons();
        if (document.getElementById('screen-historial').classList.contains('active')) {
            renderHistory();
        }
    }
    
    loadInitialData();

    function renderServiciosButtons() {
        const groupVenta = document.getElementById('servicio-group');
        const groupEdit = document.getElementById('edit-servicio-group');
        const listAdmin = document.getElementById('lista-servicios');
        
        if(groupVenta) groupVenta.innerHTML = '';
        if(groupEdit) groupEdit.innerHTML = '';
        if(listAdmin) listAdmin.innerHTML = '';
        
        serviciosList.forEach((s, i) => {
            if(groupVenta) {
                const btnVenta = document.createElement('button');
                btnVenta.className = 'pill-btn';
                btnVenta.dataset.value = s;
                btnVenta.textContent = s;
                btnVenta.addEventListener('click', () => {
                    document.querySelectorAll('#servicio-group .pill-btn').forEach(b => b.classList.remove('active'));
                    btnVenta.classList.add('active');
                    state.servicio = s;
                });
                groupVenta.appendChild(btnVenta);
            }
            
            if(groupEdit) {
                const btnEdit = document.createElement('button');
                btnEdit.className = 'pill-btn';
                btnEdit.dataset.value = s;
                btnEdit.textContent = s;
                btnEdit.addEventListener('click', () => {
                    document.querySelectorAll('#edit-servicio-group .pill-btn').forEach(b => b.classList.remove('active'));
                    btnEdit.classList.add('active');
                    editState.servicio = s;
                });
                groupEdit.appendChild(btnEdit);
            }
            
            if(listAdmin) {
                const adminItem = document.createElement('div');
                adminItem.style.display = 'flex';
                adminItem.style.justifyContent = 'space-between';
                adminItem.style.alignItems = 'center';
                adminItem.style.padding = '12px 16px';
                adminItem.style.background = '#f8fafc';
                adminItem.style.borderRadius = '12px';
                
                adminItem.innerHTML = `
                    <span style="font-weight: 500; font-size: 15px; color: #2d3748;">${s}</span>
                    <button class="delete-srv-btn" data-index="${i}" style="background: none; border: none; color: #ef4444; font-size: 16px; padding: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                `;
                listAdmin.appendChild(adminItem);
            }
        });
        
        if(listAdmin) {
            document.querySelectorAll('.delete-srv-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    const val = serviciosList[idx];
                    if (confirm(`¿Segura que querés eliminar el servicio "${val}"?`)) {
                        serviciosList.splice(idx, 1);
                        renderServiciosButtons();
                        try {
                            await fetch(`${supabaseUrl}/aguscau_servicios?nombre=eq.${encodeURIComponent(val)}`, {
                                method: 'DELETE',
                                headers: supabaseHeaders
                            });
                        } catch (err) {
                            console.error('Error deleting service', err);
                        }
                    }
                });
            });
        }
    }

    renderServiciosButtons();

    const addSrvBtn = document.getElementById('btn-add-servicio');
    if (addSrvBtn) {
        addSrvBtn.addEventListener('click', async () => {
            const input = document.getElementById('nuevo-servicio-input');
            const val = input.value.trim();
            if (val && !serviciosList.includes(val)) {
                serviciosList.push(val);
                input.value = '';
                renderServiciosButtons();
                try {
                    await fetch(`${supabaseUrl}/aguscau_servicios`, {
                        method: 'POST',
                        headers: supabaseHeaders,
                        body: JSON.stringify({ nombre: val })
                    });
                } catch (err) {
                    console.error('Error saving service', err);
                }
            }
        });
    }

    // User Role Management
    let currentUser = null;
    let userRole = null;
    const bottomNav = document.querySelector('.bottom-nav');
    bottomNav.style.display = 'none'; // Hide initially

    const loginBtns = document.querySelectorAll('.login-btn');
    loginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentUser = btn.dataset.user;
            userRole = currentUser === 'Agus' ? 'admin' : 'staff';
            
            // Apply Permissions
            if (userRole === 'admin') {
                document.querySelector('.metrics-card').style.display = 'block';
            } else {
                document.querySelector('.metrics-card').style.display = 'none';
            }
            
            bottomNav.style.display = 'flex'; // Show nav after login
            
            state.profesional = currentUser;
            const profBtns = document.querySelectorAll('#profesional-group .pill-btn');
            profBtns.forEach(b => {
                b.classList.remove('active');
                if (b.dataset.value === currentUser) {
                    b.classList.add('active');
                }
                if (userRole !== 'admin' && b.dataset.value !== currentUser) {
                    b.style.display = 'none';
                } else {
                    b.style.display = 'inline-block';
                }
            });
            
            switchScreen('screen-nueva-venta');
        });
    });

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    function switchScreen(targetId) {
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        navItems.forEach(nav => {
            if(nav.dataset.target === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        if(targetId === 'screen-historial') {
            renderHistory();
        }
        
        if (targetId === 'screen-perfil') {
            document.getElementById('perfil-nombre').textContent = currentUser;
            document.getElementById('perfil-avatar').textContent = currentUser ? currentUser.charAt(0).toUpperCase() : 'U';
            document.getElementById('perfil-rol').textContent = userRole === 'admin' ? 'Administradora' : 'Staff';
            
            if (userRole === 'admin') {
                document.getElementById('admin-section').style.display = 'block';
                document.getElementById('admin-servicios-section').style.display = 'block';
                
                const totalBruto = history.reduce((acc, curr) => acc + curr.cobrar, 0);
                const staffSales = history.filter(h => h.empleado !== 'Agus').reduce((acc, curr) => acc + curr.cobrar, 0);
                const comisionesAPagar = staffSales * 0.40;
                const netoEstudio = totalBruto - comisionesAPagar;
                
                document.getElementById('admin-bruto').textContent = `$${totalBruto.toLocaleString('es-AR')}`;
                document.getElementById('admin-comisiones').textContent = `-$${comisionesAPagar.toLocaleString('es-AR')}`;
                document.getElementById('admin-neto').textContent = `$${netoEstudio.toLocaleString('es-AR')}`;
            } else {
                document.getElementById('admin-section').style.display = 'none';
                document.getElementById('admin-servicios-section').style.display = 'none';
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchScreen(item.dataset.target);
        });
    });

    // Form logic
    const profBtns = document.querySelectorAll('#profesional-group .pill-btn');
    profBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (userRole !== 'admin') return;
            profBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.profesional = btn.dataset.value;
        });
    });



    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.metodoPago = btn.dataset.value;
        });
    });

    const precioInput = document.getElementById('precio-total');
    const senaInput = document.getElementById('sena-pagada');
    const saldoDisplay = document.getElementById('saldo-pagar');

    function updateSaldo() {
        const precio = parseFloat(precioInput.value) || 0;
        const sena = parseFloat(senaInput.value) || 0;
        const saldo = Math.max(0, precio - sena);
        
        state.precioTotal = precio;
        state.senaPagada = sena;
        
        saldoDisplay.textContent = `$${saldo.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    precioInput.addEventListener('input', updateSaldo);
    senaInput.addEventListener('input', updateSaldo);

    state.foto = null;
    const fotoInput = document.getElementById('foto-trabajo');
    const fotoPreview = document.getElementById('foto-preview');
    const btnRemoveFoto = document.getElementById('btn-remove-foto');
    
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    state.foto = event.target.result;
                    fotoPreview.style.backgroundImage = `url(${state.foto})`;
                    fotoPreview.style.display = 'block';
                    btnRemoveFoto.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        btnRemoveFoto.addEventListener('click', () => {
            state.foto = null;
            fotoInput.value = '';
            fotoPreview.style.display = 'none';
            btnRemoveFoto.style.display = 'none';
        });
    }

    // Confirm button
    const btnConfirmar = document.getElementById('btn-confirmar');
    btnConfirmar.addEventListener('click', async () => {
        state.cliente = document.getElementById('cliente-nombre').value;

        if(!state.profesional || !state.cliente || !state.servicio || state.precioTotal <= 0 || !state.metodoPago) {
            alert('Por favor, completá todos los campos antes de confirmar.');
            return;
        }

        if(state.senaPagada > state.precioTotal) {
            alert('La seña no puede ser mayor al precio total.');
            return;
        }

        const aCobrar = state.precioTotal - state.senaPagada;
        const newRecord = {
            id: Date.now(),
            fecha: new Date().toISOString(),
            empleado: state.profesional,
            clienta: state.cliente,
            servicio: state.servicio,
            total: state.precioTotal,
            sena: state.senaPagada,
            cobrar: aCobrar,
            pago: state.metodoPago,
            foto: state.foto || null
        };

        history.unshift(newRecord);
        
        const dbRecord = {
            id: newRecord.id,
            fecha: newRecord.fecha,
            staff: newRecord.empleado,
            clienta: newRecord.clienta,
            servicio: newRecord.servicio,
            total: newRecord.total,
            seña: newRecord.sena,
            cobro: newRecord.cobrar,
            pago: newRecord.pago,
            foto: newRecord.foto
        };
        
        try {
            await fetch(`${supabaseUrl}/aguscau_history`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify(dbRecord)
            });
        } catch (err) {
            console.error('Error saving history', err);
        }

        // Show success screen
        document.getElementById('success-message').textContent = `Cobro de $${aCobrar.toLocaleString('es-AR')} registrado para ${state.cliente}.`;
        
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById('screen-confirmacion').classList.add('active');
        navItems.forEach(n => n.classList.remove('active'));

        // Reset form
        document.getElementById('cliente-nombre').value = '';
        precioInput.value = '';
        senaInput.value = '';
        updateSaldo();
        document.querySelectorAll('#servicio-group .pill-btn').forEach(b => b.classList.remove('active'));
        paymentBtns.forEach(b => b.classList.remove('active'));
        
        state.cliente = '';
        state.servicio = '';
        state.precioTotal = 0;
        state.senaPagada = 0;
        state.metodoPago = null;
        if(fotoInput) {
            state.foto = null;
            fotoInput.value = '';
            fotoPreview.style.display = 'none';
            btnRemoveFoto.style.display = 'none';
        }
        // No reseteamos state.profesional porque queda anclado al usuario logueado
    });

    document.getElementById('btn-nuevo-cobro').addEventListener('click', () => {
        switchScreen('screen-nueva-venta');
    });

    document.getElementById('btn-ir-inicio').addEventListener('click', () => {
        switchScreen('screen-historial');
    });

    // History rendering
    function getAvatarColor(char) {
        const colors = ['#ff7182', '#ffa161', '#ffb74d', '#4db6ac', '#7986cb'];
        const code = char.charCodeAt(0);
        return colors[code % colors.length];
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
        const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth();

        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        if (isToday) return `Hoy, ${time}`;
        if (isYesterday) return `Ayer, ${time}`;
        
        return `${date.getDate()}/${date.getMonth()+1}, ${time}`;
    }

    function renderHistory(filter = 'Todos') {
        const list = document.getElementById('history-list');
        list.innerHTML = '';

        const filtered = filter === 'Todos' ? history : history.filter(h => h.empleado === filter);

        filtered.forEach(item => {
            const char = item.clienta.charAt(0).toUpperCase();
            const color = getAvatarColor(char);
            
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                ${item.foto ? `<div style="width: 40px; height: 40px; border-radius: 50%; background-image: url(${item.foto}); background-size: cover; background-position: center; margin-right: 12px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>` : `<div class="avatar" style="background-color: ${color}; margin-right: 12px; flex-shrink: 0;">${char}</div>`}
                <div class="item-details" style="flex: 1;">
                    <div class="item-name" style="display: flex; align-items: center; gap: 6px;">
                        ${item.clienta} 
                        ${item.foto ? '<i class="fas fa-camera" style="color: #ff7182; font-size: 12px;"></i>' : ''}
                    </div>
                    <div class="item-meta">
                        <span><i class="far fa-user"></i> ${item.servicio}</span>
                        <span><i class="far fa-clock"></i> ${formatDate(item.fecha)}</span>
                    </div>
                </div>
                <div class="item-price-col">
                    <div class="item-price">$${item.cobrar.toLocaleString('es-AR')}</div>
                    <div class="status-badge">PAGADO</div>
                </div>
            `;
            el.addEventListener('click', () => openModal(item));
            list.appendChild(el);
        });

        // Update metrics based on filtered history
        const total = filtered.reduce((acc, curr) => acc + curr.cobrar, 0);
        document.querySelector('.metrics-value').textContent = `$${total.toLocaleString('es-AR')}`;
    }

    // Filter logic
    const filterBtns = document.querySelectorAll('.filter-scroll-container .pill-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderHistory(btn.dataset.filter);
        });
    });

    // Chart Interaction
    const chartBars = document.querySelectorAll('.bar-col');
    const chartTooltip = document.getElementById('chart-tooltip');
    
    chartBars.forEach((col) => {
        col.addEventListener('click', () => {
            chartBars.forEach(c => c.querySelector('.bar').classList.remove('bar-active'));
            col.querySelector('.bar').classList.add('bar-active');
            
            const simTotal = Math.floor(Math.random() * 50000 + 20000);
            chartTooltip.textContent = `Total: $${simTotal.toLocaleString('es-AR')}`;
            chartTooltip.style.display = 'block';
            
            // Fake filter interaction just to show the UI feedback
            renderHistory(document.querySelector('.filter-scroll-container .active').dataset.filter);
        });
    });

    // Modal Logic
    let currentEditItem = null;
    const modal = document.getElementById('service-modal');
    function openModal(item) {
        currentEditItem = item;
        document.getElementById('modal-clienta').textContent = item.clienta;
        document.getElementById('modal-fecha').innerHTML = `<i class="far fa-clock"></i> ${formatDate(item.fecha)}`;
        document.getElementById('modal-servicio').textContent = item.servicio;
        document.getElementById('modal-profesional').textContent = item.empleado;

        const modalFoto = document.getElementById('modal-foto');
        if(item.foto) {
            modalFoto.style.backgroundImage = `url(${item.foto})`;
            modalFoto.style.display = 'block';
        } else {
            modalFoto.style.display = 'none';
        }

        document.getElementById('modal-total').textContent = `$${item.total.toLocaleString('es-AR')}`;
        document.getElementById('modal-sena').textContent = `$${item.sena.toLocaleString('es-AR')}`;
        document.getElementById('modal-pago').textContent = item.pago;
        document.getElementById('modal-cobrar').textContent = `$${item.cobrar.toLocaleString('es-AR')}`;
        
        if (userRole === 'admin') {
            document.getElementById('modal-comision-container').style.display = 'flex';
            document.getElementById('btn-editar').style.display = 'block';
            const comision = item.total * 0.40; // 40%
            document.getElementById('modal-comision').textContent = `$${comision.toLocaleString('es-AR')}`;
        } else {
            document.getElementById('modal-comision-container').style.display = 'none';
            document.getElementById('btn-editar').style.display = 'none';
        }

        modal.classList.add('active');
    }

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Edit Logic


    const editFotoInput = document.getElementById('edit-foto-trabajo');
    const editFotoPreview = document.getElementById('edit-foto-preview');
    const editBtnRemoveFoto = document.getElementById('edit-btn-remove-foto');

    if (editFotoInput) {
        editFotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    editState.foto = event.target.result;
                    editFotoPreview.style.backgroundImage = `url(${editState.foto})`;
                    editFotoPreview.style.display = 'block';
                    editBtnRemoveFoto.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        editBtnRemoveFoto.addEventListener('click', () => {
            editState.foto = null;
            editFotoInput.value = '';
            editFotoPreview.style.display = 'none';
            editBtnRemoveFoto.style.display = 'none';
        });
    }

    document.getElementById('btn-editar').addEventListener('click', () => {
        if (!currentEditItem || userRole !== 'admin') return;
        
        document.getElementById('edit-id').value = currentEditItem.id;
        document.getElementById('edit-cliente-nombre').value = currentEditItem.clienta;
        document.getElementById('edit-precio-total').value = currentEditItem.total;
        document.getElementById('edit-sena-pagada').value = currentEditItem.sena;
        
        editState.foto = currentEditItem.foto || null;
        if(editState.foto) {
            editFotoPreview.style.backgroundImage = `url(${editState.foto})`;
            editFotoPreview.style.display = 'block';
            editBtnRemoveFoto.style.display = 'block';
        } else {
            editFotoPreview.style.display = 'none';
            editBtnRemoveFoto.style.display = 'none';
            if(editFotoInput) editFotoInput.value = '';
        }
        
        editState.servicio = currentEditItem.servicio;
        document.querySelectorAll('#edit-servicio-group .pill-btn').forEach(b => {
            if (b.dataset.value === currentEditItem.servicio) b.classList.add('active');
            else b.classList.remove('active');
        });
        
        modal.classList.remove('active');
        switchScreen('screen-editar-venta');
    });

    document.getElementById('btn-back-edit').addEventListener('click', () => {
        switchScreen('screen-historial');
    });

    document.getElementById('btn-guardar-edicion').addEventListener('click', async () => {
        if (!currentEditItem) return;
        
        const newTotal = parseFloat(document.getElementById('edit-precio-total').value) || 0;
        const newSena = parseFloat(document.getElementById('edit-sena-pagada').value) || 0;
        
        if(newSena > newTotal) {
            alert('La seña no puede ser mayor al precio total.');
            return;
        }
        
        currentEditItem.clienta = document.getElementById('edit-cliente-nombre').value;
        currentEditItem.servicio = editState.servicio;
        currentEditItem.total = newTotal;
        currentEditItem.sena = newSena;
        currentEditItem.cobrar = Math.max(0, newTotal - newSena);
        currentEditItem.foto = editState.foto || null;
        
        const index = history.findIndex(h => h.id === currentEditItem.id);
        if (index > -1) {
            history[index] = currentEditItem;
            
            const dbRecord = {
                staff: currentEditItem.empleado,
                clienta: currentEditItem.clienta,
                servicio: currentEditItem.servicio,
                total: currentEditItem.total,
                seña: currentEditItem.sena,
                cobro: currentEditItem.cobrar,
                pago: currentEditItem.pago,
                foto: currentEditItem.foto
            };
            
            try {
                await fetch(`${supabaseUrl}/aguscau_history?id=eq.${currentEditItem.id}`, {
                    method: 'PATCH',
                    headers: supabaseHeaders,
                    body: JSON.stringify(dbRecord)
                });
            } catch (err) {
                console.error('Error updating history', err);
            }
        }
        
        alert('Registro actualizado correctamente');
        switchScreen('screen-historial');
    });

    document.getElementById('btn-eliminar-registro').addEventListener('click', async () => {
        if (!currentEditItem || !confirm('¿Estás segura de que deseas eliminar este registro permanentemente?')) return;
        
        history = history.filter(h => h.id !== currentEditItem.id);
        
        try {
            await fetch(`${supabaseUrl}/aguscau_history?id=eq.${currentEditItem.id}`, {
                method: 'DELETE',
                headers: supabaseHeaders
            });
        } catch (err) {
            console.error('Error deleting history', err);
        }
        
        switchScreen('screen-historial');
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        currentUser = null;
        userRole = null;
        bottomNav.style.display = 'none';
        switchScreen('screen-login');
    });

    // Export CSV
    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "ID,Fecha,Profesional,Cliente,Servicio,Total,Seña,A Cobrar,Método\n";
            history.forEach(row => {
                csvContent += `${row.id},${row.fecha},${row.empleado},${row.clienta},${row.servicio},${row.total},${row.sena},${row.cobrar},${row.pago}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "aguscau_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Export to Google Sheets directly
    const sheetUrlInput = document.getElementById('admin-sheet-url');
    const btnExportSheets = document.getElementById('btn-export-sheets');
    
    if (sheetUrlInput) {
        sheetUrlInput.value = localStorage.getItem('aguscau_sheet_url') || '';
        sheetUrlInput.addEventListener('change', (e) => {
            localStorage.setItem('aguscau_sheet_url', e.target.value.trim());
        });
    }

    if (btnExportSheets) {
        btnExportSheets.addEventListener('click', async () => {
            const url = localStorage.getItem('aguscau_sheet_url');
            if (!url) {
                alert('Por favor, ingresa la URL de tu Google Apps Script (Web App) primero.');
                return;
            }

            const originalText = btnExportSheets.innerHTML;
            btnExportSheets.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
            btnExportSheets.disabled = true;

            try {
                // Exclude fotos so we don't hit payload limits
                const payload = history.map(h => ({
                    id: h.id,
                    fecha: h.fecha,
                    empleado: h.empleado,
                    clienta: h.clienta,
                    servicio: h.servicio,
                    total: h.total,
                    sena: h.sena,
                    cobrar: h.cobrar,
                    pago: h.pago
                }));

                await fetch(url, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                alert('¡Datos enviados a Google Sheets con éxito! Revisa tu planilla.');
            } catch (error) {
                console.error(error);
                alert('Hubo un error al conectar con Google Sheets. Revisa la URL.');
            } finally {
                btnExportSheets.innerHTML = originalText;
                btnExportSheets.disabled = false;
            }
        });
    }

    // Initial render
    renderHistory();
});
