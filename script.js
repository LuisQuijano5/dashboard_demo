function switchView(viewType) {
    document.getElementById('role').textContent = document.getElementById('role').textContent == "Cliente" ? "Administrador" : "Cliente";

    document.getElementById('btn-admin').classList.remove('active');
    document.getElementById('btn-client').classList.remove('active');
    document.getElementById('btn-' + viewType).classList.add('active');

    document.getElementById('view-admin').classList.remove('active');
    document.getElementById('view-client').classList.remove('active');
    document.getElementById('view-' + viewType).classList.add('active');
}

