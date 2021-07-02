// Con este scrapper puedes obtener información de algún bot en la botlist mediante su ID

// Ejemplo de como usarlo:

/*

	const dtBotInfo = require("./botInfo.js");
	dtBotInfo("794330629747638312")
		.then(bot => console.log(bot))
		.catch(err => console.log(err))

*/

const fetch = require("node-fetch");

const scrape = async (botID = "") => {

	if (!botID) { throw "Invalid bot ID" }
	if (typeof botID !== "string") { throw "Invalid bot ID, must be a string" }

	const response = await fetch("https://discordthings.com/bot/" + botID)
	const body = await response.text();

	var pushString = "";
	var splitBody = [];

	body.split("").map(e => {
		if (e == "<") {
			if (pushString.trim()) splitBody.push(pushString.trim());
			pushString = e;
		} else if (e == ">") {
			pushString += e;
			splitBody.push(pushString.trim());
			pushString = "";
		} else pushString += e
	});

	const pageTitle = splitBody[splitBody.indexOf("<title>") + 1];

	if (pageTitle == "DiscordThings | 404") { throw "The bot is not registered on the page" }
	if (pageTitle.includes("Web server is down")) { throw "DiscordThings web server is down, maybe for maintenance" }

	const botInfo = splitBody.filter((e, i) => { if (i > 0 && splitBody[i - 1].includes('<p class="box-2">')) return e; } );

	var votes = botInfo[2].replace("Votos:", "").trim();
	if (isNaN(votes)) votes = 0;

	const invites = botInfo[3].replace("Invitaciones:", "").trim();
	if (isNaN(invites)) invites = 0;

	var page = splitBody.find(e => e.includes('<a class="mt-3" rel="nofollow noreferer" target="_blank"'));
	if (page) page = page.match(/http.+/g)[0].slice(0, -2);

	return {
		name: splitBody[splitBody.findIndex(e => e.includes('class="has-text-white is-size-3"')) + 1],
		tag: splitBody[splitBody.findIndex(e => e.includes('<span class="is-size-4"')) + 1],
		id: splitBody.find(e => e.includes('<a href="/bot/') && e.includes('report')).match(/\d{3,}/g)[0],
		avatar: splitBody.find(e => e.includes('<img draggable="false"') && e.includes('https://cdn.discordapp.com/avatars/')).match(/https:.*"/g)[0].slice(0, -1),
		description: splitBody[splitBody.indexOf('<h3 class="has-text-white is-size-6" style="margin-bottom: 1px;">') + 1],
		author: splitBody[splitBody.indexOf('<h3 class="has-text-white is-size-6" style="margin-bottom: 1px;">') + 4],
		prefix: botInfo[0].replace("Prefix:", "").trim(),
		servers: botInfo[1].replace("Servidores:", "").trim(),
		votes: parseInt(votes),
		invites: parseInt(invites),
		page,
		botTags: splitBody.filter((e, i) => { if (i > 0 && splitBody[i - 1].includes('<span class="tag botTags')) return e; } ),
	}

}

module.exports = scrape;
