window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.fetchChartData = async function({ location='surabaya', dataType='suhuUdara', range='5' } = {}){
        const base = ns.GOOGLE_SHEET_WEB_APP_URL || '';
        if (!base) throw new Error('GOOGLE_SHEET_WEB_APP_URL belum diatur');
        const url = `${base}?range=${encodeURIComponent(range)}&dataType=${encodeURIComponent(dataType)}&location=${encodeURIComponent(location)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal menghubungi server grafik');
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal memuat data grafik');
        return result; // { status, label, data }
    };
})(window.ChartApp);
