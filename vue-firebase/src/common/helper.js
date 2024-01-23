function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    date = new Date(date);
    return format.
        replace(/YYYY/g, date.getFullYear()).
        replace(/MM/g, (date.getMonth() + 1).toString().padStart(2, '0')).
        replace(/DD/g, date.getDate().toString().padStart(2, '0')).
        replace(/HH/g, date.getHours().toString().padStart(2, '0')).
        replace(/mm/g, date.getMinutes().toString().padStart(2, '0')).
        replace(/ss/g, date.getSeconds().toString().padStart(2, '0'));
}

function getLastObjectInObjects(obj) {
    const lastIndex = Object.keys(obj).length - 1;
    return Object.keys(obj)[lastIndex];
}

export {
    formatDate, getLastObjectInObjects
}