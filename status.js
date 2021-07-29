// Con este scrapper puedes obtener información del estado de la página de discordthings.com (de la VPS)

// Ejemplo de como usarlo:

/*

	const dtStatus = require("./status.js");
	dtStatus()
		.then(status => console.log(status))
		.catch(err => console.log(err))

*/

const fetch = require("node-fetch");

const scrape = async () => {

	const body = await (await fetch("https://discordthings.com/estado")).text();

	const pageTitle = splitBody[splitBody.indexOf("<title>") + 1];
	if (pageTitle.includes("Web server is down")) { throw "DiscordThings web server is down, maybe for maintenance" }

	var pushString = "";
	var splitBody = [];

	body.split("").forEach(e => {
		if (e == "<") {
			if (pushString.trim()) splitBody.push(pushString.trim());
			pushString = e;
		} else if (e == ">") {
			pushString += e;
			splitBody.push(pushString.trim());
			pushString = "";
		} else pushString += e
	});

	const info1 = splitBody.filter( (e, i) => i > 1 && splitBody[i - 1].includes('class="has-text-white is-size-6') );
	const info2 = splitBody.filter( (e, i) => i > 1 && splitBody[i - 1].includes('p class="has-text-white is-size-3"') );

	return {
		apiLatency: parseInt(info1[0].replace("ms", "")),
		registered: parseInt(info1[1]),
		udm: parseInt(info1[2]),
		cpu: parseFloat(info1[3]),
		cpuModel: info1[4],
		uptime: parseInt(info1[5].replace("segundos", "").trim()),
		bots: parseInt( info2.find(e => e.startsWith("Bots")).replace("Bots -", "").trim() ),
		commands: parseInt( info2.find(e => e.startsWith("Comandos")).replace("Comandos -", "").trim() ),
		events: parseInt( info2.find(e => e.startsWith("Eventos")).replace("Eventos -", "").trim() )
	}

}

module.exports = scrape;
