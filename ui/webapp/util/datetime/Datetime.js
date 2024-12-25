sap.ui.define(["sap/ui/core/format/DateFormat"], function(DateFormat) {
    "use strict"

    return {
        formatDateToRFC3339: function (oDate) {
            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed
            const day = String(oDate.getDate()).padStart(2, '0');
            const hours = String(oDate.getHours()).padStart(2, '0');
            const minutes = String(oDate.getMinutes()).padStart(2, '0');
            const seconds = String(oDate.getSeconds()).padStart(2, '0');

            // Get the timezone offset in minutes and convert to hours and minutes
            const timezoneOffset = oDate.getTimezoneOffset();  // This is in minutes (UTC - local)
            const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
            const offsetMinutes = Math.abs(timezoneOffset) % 60;

            // Format the timezone part (e.g., +03:00 or -03:30)
            const timezoneSign = timezoneOffset > 0 ? '-' : '+';
            const formattedOffset = `${timezoneSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

            // Combine everything into the RFC 3339 format
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
        },

        readableFormatter: function () {
            return DateFormat.getDateTimeInstance({
                pattern: "dd MMM yyyy, HH:mm:ss"
            })
        },
    }
})
