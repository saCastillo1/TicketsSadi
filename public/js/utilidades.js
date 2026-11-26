// =========================================================
// Tickets Sadi - funciones de apoyo compartidas
// =========================================================

// evita que el texto escrito por los usuarios se interprete como HTML
function escapar_Texto(texto) {
	const div = document.createElement('div');
	div.textContent = texto == null ? '' : String(texto);
	return div.innerHTML;
}

// convierte un Timestamp de Firestore en texto legible
function formato_Fecha(marca_Tiempo) {
	if (!marca_Tiempo) return '-';
	const fecha = marca_Tiempo.toDate ? marca_Tiempo.toDate() : new Date(marca_Tiempo);
	return fecha.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' });
}

// convierte un Timestamp al formato que usa el campo datetime-local
function fecha_A_Input(marca_Tiempo) {
	if (!marca_Tiempo) return '';
	const fecha = marca_Tiempo.toDate ? marca_Tiempo.toDate() : new Date(marca_Tiempo);
	const dos = (n) => String(n).padStart(2, '0');
	return fecha.getFullYear() + '-' + dos(fecha.getMonth() + 1) + '-' + dos(fecha.getDate()) +
		   'T' + dos(fecha.getHours()) + ':' + dos(fecha.getMinutes());
}