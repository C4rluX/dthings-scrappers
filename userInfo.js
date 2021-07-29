// Con este scrapper puedes obtener información de algún usuario registrado en la botlist mediante su ID

// Ejemplo de como usarlo:

/*

	const dtUserInfo = require("./userInfo.js");
	dtUserInfo("654118072285921281")
		.then(bot => console.log(user))
		.catch(err => console.log(err))

*/

const fetch = require("node-fetch");

const scrape = async (userID = "") => {

	function formatHTML(text) { // Esto es para que sea 'opcional' incluir el módulo 'formatHTMLEntities.js' en tu proyecto
		try { return require("./formatHTMLEntities.js").decode(text); }
		catch { return text; }
	}

	function parseNumber(str) {
		if (isNaN(str)) return 0;
		else return parseInt(str);
	}

	if (!userID) { throw "Invalid user ID" }
	if (typeof userID !== "string") { throw "Invalid user ID, must be a string" }

	const body = await (await fetch("https://discordthings.com/u/" + userID)).text();

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

	const pageTitle = splitBody[splitBody.indexOf("<title>") + 1];
	if (pageTitle == "DiscordThings | 404") { throw "The user is not registered on the page" }
	if (pageTitle.includes("Web server is down")) { throw "DiscordThings web server is down, maybe for maintenance" }

	var votes = splitBody[splitBody.indexOf('<span class="heading has-text-white">') + 1];
	if (isNaN(votes)) votes = 0;

	var badges = splitBody.filter( (e, i) => splitBody[i - 1] == '<span class="tooltiptext">' && !splitBody[i - 2].includes("discord.com/assets/") );

	var staffPoints = badges.find(e => e.startsWith("Puntos:"));
	if (staffPoints) {
		staffPoints = staffPoints.replace("Puntos:", "").trim();
		if (isNaN(staffPoints)) staffPoints = 0;
		else staffPoints = parseInt(staffPoints);
		badges.splice(badges.findIndex(e => e.startsWith("Puntos:")), 1);
	}
	else staffPoints = false;

	var userBotsLinks = splitBody.filter(e => e.includes('<a title=') && e.includes('class="cardBtn1"'));
	userBotsLinks = userBotsLinks.map(e => {

		var username = splitBody[splitBody.indexOf(e) - 7];
		var certified = false;
		var avatar = splitBody[splitBody.indexOf(e) - 11];
		var invites = splitBody[splitBody.indexOf(e) - 15];
		var votes = splitBody[splitBody.indexOf(e) - 19];

		if (username.startsWith("<img draggable")) {
			username = splitBody[splitBody.indexOf(e) - 8];
			certified = true;
			avatar = splitBody[splitBody.indexOf(e) - 12];
			invites = splitBody[splitBody.indexOf(e) - 16];
			votes = splitBody[splitBody.indexOf(e) - 20];
		}

		invites = parseNumber(invites.replace("Invites:", "").trim());
		votes = parseNumber(votes.replace("Votos:", "").trim());

		return {
			username: formatHTML(username),
			id: e.match(/\d{3,}/g)[0],
			avatar: avatar.match(/https:.+webp/g)[0],
			description: formatHTML(splitBody[splitBody.indexOf(e) - 4]),
			votes,
			invites,
			certified,
		}

	});

	var userStatus = splitBody.find(e => e.includes('<i class="status2 fad fa-circle'));
	var status = "online";

	if (userStatus.includes('warning')) status = "idle";
	if (userStatus.includes('danger')) status = "dnd";
	if (userStatus.includes('dark')) status = "offline";
	
	return {
		username: formatHTML(splitBody[splitBody.findIndex(e => e.includes('class="UserName is-size-5 has-text-white"')) + 1]),
		id: userID,
		status,
		avatar: splitBody.find((e, i) => e.includes('<img draggable="false" onerror="imgError(this);"') && splitBody[i-1] == "<br>").match(/https:.+" /g)[0].slice(0, -2),
		description: formatHTML(splitBody[splitBody.indexOf('<p class="has-text-white">') + 1]),
		votes: parseInt(votes),
		lastSession: splitBody[splitBody.findIndex((e, i) => e.includes('<span class="heading has-text-white">') && splitBody[i - 1] == '<div>') + 1],
		staffPoints,
		badges,
		discordBadges: splitBody.filter( (e, i) => splitBody[i - 1] == '<span class="tooltiptext">' && splitBody[i - 2].includes("discord.com/assets/")),
		bots: userBotsLinks,
	}

}

module.exports = scrape;
