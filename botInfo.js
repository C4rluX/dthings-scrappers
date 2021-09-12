// Con este scrapper puedes obtener información de algún bot en la botlist mediante su ID

// Ejemplo de como usarlo:

/*
	
	// Sin descargar el widget del bot
	const dtBotInfo = require("./botInfo.js");
	dtBotInfo("794330629747638312")
		.then(bot => console.log(bot))
		.catch(err => console.log(err))

	// Descargando el widget del bot
	const dtBotInfo = require("./botInfo.js");
	dtBotInfo("794330629747638312", { downloadWidget: true })
		.then(bot => console.log(bot))
		.catch(err => console.log(err))

*/

const fetch = require("node-fetch");

const scrape = async (botID = "", options = {}) => {

	function formatHTML(text) { // Esto es para que sea 'opcional' incluir el módulo 'formatHTMLEntities.js' en tu proyecto
		try { return require("./formatHTMLEntities.js").decode(text); }
		catch { return text; }
	}

	function parseNumber(str) {
		if (isNaN(str)) return 0;
		else return parseInt(str);
	}

	function clearAvatarLink(str) {
		return (
			(str.indexOf("?size=") == -1) ? str : str.slice(0, str.indexOf("?size="))
		).replace(".webp", "");
	}

	function extractHref(str) {
		try {
			str = formatHTML(str);
			if (str.match(/href=.+" /g)) return str.match(/href=.+" /g)[0].slice(6, -2);
			return str.match(/href=.+">/g)[0].slice(6, -2); 
		} catch { return undefined; }
	}

	if (!botID) { throw "Invalid bot ID" }
	if (typeof botID !== "string") { throw "Invalid bot ID, must be a string" }

	const body = await (await fetch("https://discordthings.com/bot/" + botID)).text();

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

	if (body.includes('DiscordThings - 404')) { throw "The bot is not registered on the page" }
	const info = splitBody.filter((e, i) => i > 0 && splitBody[i - 1].includes('class="float-right has-text-white"'));
	const id = splitBody.find(e => e.includes("<a href=") && e.includes("/report")).match(/\d{3,}/g)[0];
	const authors = splitBody.filter((e, i) => i > 0 && splitBody[i - 1].includes('class="has-text-white"') && splitBody[i - 2].includes('class="dthingsflex__card-content"')).slice(4).map((e, i) => e + info.slice(4)[i]);
	const botsLinks = splitBody.filter(e => e.startsWith("<a") && e.includes('class="mt-3"'));

	let invite = `https://discordthings.com/bot/${id}/invite`;
	try { invite = (await fetch(invite)).url }
	catch {}

	let widget = `https://discordthings.com/bot/${id}/widget`;
	if (options["downloadWidget"] && options["downloadWidget"] == true) {
		try {
			widget = await (await fetch(widget)).buffer();
		} catch (err) { throw `Widget download failed: ${err}` }
	}

	return {
		username: formatHTML(splitBody[splitBody.findIndex(e => e.includes('class="dthings__main__title mt-2"')) + 1]),
		id,
		avatar: clearAvatarLink(splitBody.find(e => e.startsWith("<img") && e.includes('class="botlogo"')).match(/https:.*" /g)[0].slice(0, -2)),
		description: formatHTML(splitBody[splitBody.findIndex(e => e.includes('class="lead dthings__main__subtitle mb-2"')) + 1]),
		tags: splitBody.filter((e, i) => i > 0 && splitBody[i - 1].includes('class="tag botTags mb-1"')),
		prefix: formatHTML(info[0]),
		servers: info[1],
		votes: parseNumber(info[2]),
		invites: parseNumber(info[3]),
		authors,
		invite,
		page: extractHref(botsLinks[0]) || undefined,
		supportServer: extractHref(botsLinks[1]) || undefined,
		github: extractHref(botsLinks[2]) || undefined,
		donate: extractHref(botsLinks[3]) || undefined,
		verified: new Boolean(splitBody.find((e, i) => i > 0 && e == "Verificado" && splitBody[i - 1].includes('class="tooltiptext2"'))).valueOf(),
		certified: new Boolean(splitBody.find((e, i) => i > 0 && e == "Certificado" && splitBody[i - 1].includes('class="tooltiptext2"'))).valueOf(),
		widget
	}

}

module.exports = scrape;
