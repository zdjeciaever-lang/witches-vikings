/* --- KONFIGURACJA --- */
const EMAIL_KEY = "_xu3ozJ-a_2YiGJpb";
const ADMINS = [
    { id:1, login:"arcydruid", pass:"las123", role:"Arcydruid" },
    { id:2, login:"jarl", pass:"topor456", role:"Jarl" },
    { id:3, login:"wiedzma", pass:"ziola789", role:"Wiedźma" }
];

/* --- GLÓWNY SILNIK APLIKACJI (App Engine) --- */
const app = {
    user: null,
    cartItems: [],
    
    init: () => {
        try { emailjs.init(EMAIL_KEY); } catch(e) {}
        app.db.init();
        app.checkSession();
        
        // Hide loader
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        }, 1200);

        app.ui.cursor();
        app.ui.parallax();
        app.shop.render();
    },

    /* --- ROUTER (SPA) --- */
    router: {
        go: (viewId) => {
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.classList.add('hidden');
            });
            const target = document.getElementById('view-' + viewId);
            if(target) {
                target.classList.remove('hidden');
                setTimeout(() => target.classList.add('active'), 10);
            }
            window.scrollTo(0,0);
        }
    },

    /* --- DATABASE --- */
    db: {
        init: () => {
            if(!localStorage.getItem('wv_products')) {
                const p = [
                    {id:1, name:"Kula Przyszłości", price:89, cat:"witch", img:"https://images.unsplash.com/photo-1597944427852-3379b021450b?q=80&w=600"},
                    {id:2, name:"Topór Północy", price:120, cat:"viking", img:"https://images.unsplash.com/photo-1589911725160-2f29695e9314?q=80&w=600"},
                    {id:3, name:"Fioletowy Płomień", price:45, cat:"witch", img:"https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=600"},
                    {id:4, name:"Róg Walhalli", price:65, cat:"viking", img:"https://images.unsplash.com/photo-1578506605150-654089547338?q=80&w=600"},
                    {id:5, name:"Amulet Cienia", price:55, cat:"witch", img:"https://images.unsplash.com/photo-1608649931604-338c2279185e?q=80&w=600"},
                    {id:6, name:"Tarcza Jarlów", price:150, cat:"viking", img:"https://images.unsplash.com/photo-1618378024367-b86b1011c4a5?q=80&w=600"}
                ];
                localStorage.setItem('wv_products', JSON.stringify(p));
            }
            if(!localStorage.getItem('wv_users')) localStorage.setItem('wv_users', JSON.stringify([]));
        },
        get: (k) => JSON.parse(localStorage.getItem('wv_'+k) || "[]"),
        set: (k, v) => localStorage.setItem('wv_'+k, JSON.stringify(v))
    },

    /* --- AUTH --- */
    auth: {
        switchTab: (tab) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('formClientLogin').classList.add('hidden');
            document.getElementById('formClientReg').classList.add('hidden');
            if(tab==='login') {
                document.querySelector('.tab-btn:first-child').classList.add('active');
                document.getElementById('formClientLogin').classList.remove('hidden');
            } else {
                document.querySelector('.tab-btn:last-child').classList.add('active');
                document.getElementById('formClientReg').classList.remove('hidden');
            }
        },
        login: (l, p) => {
            const u = app.db.get('users').find(x => x.login === l && x.pass === p);
            if(u) {
                app.user = u;
                sessionStorage.setItem('wv_session', JSON.stringify(u));
                app.modals.close();
                app.ui.toast(`Witaj, ${u.login}`);
                app.auth.updateUI();
            } else {
                app.ui.toast("Błędne dane", "error");
            }
        },
        register: (l, e, p) => {
            const users = app.db.get('users');
            if(users.find(x => x.login === l)) return app.ui.toast("Zajęte!", "error");
            users.push({login:l, email:e, pass:p, orders:[]});
            app.db.set('users', users);
            app.ui.toast("Konto utworzone!");
            app.auth.switchTab('login');
        },
        adminLogin: (l, p) => {
            const adm = ADMINS.find(a => a.login === l && a.pass === p);
            if(adm) {
                app.modals.close();
                document.querySelector('.navbar').style.display = 'none';
                app.router.go('admin');
                document.getElementById('adminNameDisplay').innerText = adm.role;
                app.admin.refresh();
                app.ui.toast(`Witaj, ${adm.role}!`);
            } else {
                app.ui.toast("Odmowa dostępu", "error");
            }
        },
        toggleAdminForgot: (show) => {
            if(show) {
                document.getElementById('formAdminLogin').classList.add('hidden');
                document.getElementById('formAdminForgot').classList.remove('hidden');
            } else {
                document.getElementById('formAdminForgot').classList.add('hidden');
                document.getElementById('formAdminLogin').classList.remove('hidden');
            }
        },
        handleProfileClick: () => app.user ? app.ui.toast(`Zalogowany jako: ${app.user.login}`) : app.modals.open('clientAuth'),
        updateUI: () => {
            if(app.user) document.getElementById('userIcon').style.color = "var(--gold)";
        }
    },

    /* --- SHOP --- */
    shop: {
        render: (cat='all') => {
            let p = app.db.get('products');
            if(cat!=='all') p = p.filter(x => x.cat === cat);
            const grid = document.getElementById('shopGrid');
            grid.innerHTML = p.map(x => `
                <div class="card">
                    <img src="${x.img}">
                    <div class="card-body">
                        <h4>${x.name}</h4>
                        <div class="card-price">${x.price} PLN</div>
                        <button class="btn-primary full" onclick="app.cart.add(${x.id})">Do Sakwy</button>
                    </div>
                </div>
            `).join('');
        },
        filter: (cat, btn) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            app.shop.render(cat);
        },
        search: (val) => {
            const p = app.db.get('products').filter(x => x.name.toLowerCase().includes(val.toLowerCase()));
            const grid = document.getElementById('shopGrid');
            grid.innerHTML = p.map(x => `
                <div class="card"><img src="${x.img}"><div class="card-body"><h4>${x.name}</h4><div class="card-price">${x.price} PLN</div><button class="btn-primary full" onclick="app.cart.add(${x.id})">Do Sakwy</button></div></div>
            `).join('');
        }
    },

    /* --- CART --- */
    cart: {
        add: (id) => {
            const p = app.db.get('products').find(x => x.id === id);
            app.cartItems.push(p);
            app.cart.update();
            app.ui.toast("Dodano artefakt");
        },
        toggle: () => document.getElementById('cart-panel').classList.toggle('open'),
        update: () => {
            const count = app.cartItems.length;
            document.getElementById('cartBadge').innerText = count;
            document.getElementById('cartHeaderCount').innerText = `(${count})`;
            document.getElementById('cart-body').innerHTML = app.cartItems.map(x => `
                <div class="cart-item"><img src="${x.img}"><div><b>${x.name}</b><br>${x.price} PLN</div></div>
            `).join('');
            const total = app.cartItems.reduce((a,b)=>a+b.price,0);
            document.getElementById('cartTotal').innerText = total + " PLN";
        },
        checkout: () => {
            if(!app.cartItems.length) return app.ui.toast("Pusto!", "error");
            if(app.user) {
                const users = app.db.get('users');
                const idx = users.findIndex(u => u.login === app.user.login);
                const total = app.cartItems.reduce((a,b)=>a+b.price,0);
                users[idx].orders.push({date: new Date().toLocaleDateString(), total: total, status: "Warzenie", items: app.cartItems});
                app.db.set('users', users);
            }
            app.cartItems = [];
            app.cart.update();
            app.cart.toggle();
            app.ui.toast("Zamówienie przyjęte!", "success");
        }
    },

    /* --- ADMIN --- */
    admin: {
        switchView: (id) => {
            document.querySelectorAll('.adm-subview').forEach(x => x.classList.add('hidden'));
            document.getElementById('adm-'+id).classList.remove('hidden');
            if(id === 'products') app.admin.renderProds();
            if(id === 'orders') app.admin.renderOrders();
        },
        refresh: () => {
            const p = app.db.get('products');
            const u = app.db.get('users');
            document.getElementById('statProd').innerText = p.length;
            document.getElementById('statUsers').innerText = u.length;
            let val = 0;
            u.forEach(user => user.orders.forEach(o => val += o.total));
            document.getElementById('statValue').innerText = val + " PLN";
        },
        renderProds: () => {
            document.getElementById('admProdTable').innerHTML = app.db.get('products').map(x => `
                <tr><td><img src="${x.img}"></td><td>${x.name}</td><td>${x.price}</td><td><i class="fa-solid fa-trash" style="color:red;cursor:pointer" onclick="app.admin.delProd(${x.id})"></i></td></tr>
            `).join('');
        },
        renderOrders: () => {
            let html = '';
            app.db.get('users').forEach(u => {
                u.orders.forEach((o, i) => {
                    html += `<tr><td>${u.login}</td><td>${o.total} zł</td><td>${o.status}</td><td><button class="btn-gold" style="padding:2px 10px;font-size:0.8rem" onclick="app.admin.changeStatus('${u.login}', ${i})">Awansuj</button></td></tr>`;
                });
            });
            document.getElementById('admOrderTable').innerHTML = html;
        },
        addProd: (n, p, c, i) => {
            const products = app.db.get('products');
            products.push({id: Date.now(), name:n, price:Number(p), cat:c, img:i});
            app.db.set('products', products);
            app.modals.close();
            app.admin.renderProds();
            app.ui.toast("Stworzono!");
        },
        delProd: (id) => {
            const p = app.db.get('products').filter(x => x.id !== id);
            app.db.set('products', p);
            app.admin.renderProds();
        },
        changeStatus: (login, idx) => {
            const u = app.db.get('users');
            const userIdx = u.findIndex(x => x.login === login);
            const statuses = ["Warzenie", "Zaklinanie", "Wysłano krukiem"];
            let current = u[userIdx].orders[idx].status;
            let next = statuses[statuses.indexOf(current) + 1] || "Dostarczono";
            u[userIdx].orders[idx].status = next;
            app.db.set('users', u);
            app.admin.renderOrders();
            app.ui.toast(`Status: ${next}`);
        }
    },

    /* --- UI HELPERS --- */
    ui: {
        toast: (msg, type='info') => {
            const t = document.createElement('div');
            t.className = 'toast';
            t.innerHTML = `<i class="fa-solid fa-${type==='error'?'triangle-exclamation':'star'}"></i> ${msg}`;
            t.style.borderLeft = type==='error' ? '4px solid red' : '4px solid var(--gold)';
            document.getElementById('toast-container').appendChild(t);
            setTimeout(() => t.remove(), 3000);
        },
        cursor: () => {
            const dot = document.querySelector('.cursor-dot');
            const ring = document.querySelector('.cursor-ring');
            document.addEventListener('mousemove', e => {
                dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
                setTimeout(() => { ring.style.left = (e.clientX-17.5)+'px'; ring.style.top = (e.clientY-17.5)+'px'; }, 50);
                if(e.target.closest('button, a, input')) document.body.classList.add('hover'); else document.body.classList.remove('hover');
            });
        },
        parallax: () => {
            document.addEventListener('mousemove', e => {
                const x = (window.innerWidth - e.pageX*2)/100;
                const y = (window.innerHeight - e.pageY*2)/100;
                const bg = document.getElementById('parallax-bg');
                if(bg) bg.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
    },
    modals: {
        open: (id) => {
            app.modals.close();
            document.getElementById('modal-'+id).classList.remove('hidden');
        },
        close: () => document.querySelectorAll('.modal-overlay').forEach(x => x.classList.add('hidden'))
    },
    checkSession: () => {
        const s = sessionStorage.getItem('wv_session');
        if(s) { app.user = JSON.parse(s); app.auth.updateUI(); }
    }
};

/* --- EVENT LISTENERS --- */
document.addEventListener('DOMContentLoaded', app.init);

// Forms
document.getElementById('formClientLogin').onsubmit = (e) => { e.preventDefault(); app.auth.login(document.getElementById('clLogin').value, document.getElementById('clPass').value); };
document.getElementById('formClientReg').onsubmit = (e) => { e.preventDefault(); app.auth.register(document.getElementById('crLogin').value, document.getElementById('crEmail').value, document.getElementById('crPass').value); };
document.getElementById('formAdminLogin').onsubmit = (e) => { e.preventDefault(); app.auth.adminLogin(document.getElementById('admUser').value, document.getElementById('admPass').value); };
document.getElementById('formAddProd').onsubmit = (e) => { 
    e.preventDefault(); 
    app.admin.addProd(document.getElementById('npName').value, document.getElementById('npPrice').value, document.getElementById('npCat').value, document.getElementById('npImg').value); 
};
document.getElementById('formAdminForgot').onsubmit = (e) => {
    e.preventDefault();
    app.ui.toast("Wysyłanie kruka...", "info");
    const email = document.getElementById('admForgotEmail').value;
    // Prawdziwe wysyłanie (jeśli masz template w EmailJS)
    emailjs.send("default_service", "template_id", {to_email: email}).then(
        () => app.ui.toast("Wysłano!", "success"),
        () => app.ui.toast("Symulacja wysłania (Kruk poleciał)", "success")
    );
    app.auth.toggleAdminForgot(false);
};