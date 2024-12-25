sap.ui.define([], function() {
    "use strict"

    return {
        fetch: async (query) => {
            let result;
            const oResponse = await fetch(
                'http://localhost:8000/query',
                {
                    method: 'POST',
                    body: query,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

            if (!oResponse.ok) {
                throw new Error(`Graphql request failed with ${oResponse.statusText} and status: ${oResponse.status}`)
            }
            result = await oResponse.json()

            return result?.data?.result
        },
    }
})