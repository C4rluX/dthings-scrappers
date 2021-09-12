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

	function clearAvatarLink(str) {
		return (
			(str.indexOf("?size=") == -1) ? str : str.slice(0, str.indexOf("?size="))
		).replace(".webp", "");
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

	if (body.includes('DiscordThings - 404')) { throw "The user is not registered on the page" }

	let avatar = clearAvatarLink(splitBody.find(e => e.includes('<img class="botlogo"')).match(/https:.+" /g)[0].slice(0, -2));
	if (avatar.endsWith(userID + "/")) avatar = undefined;

	let staffPoints = splitBody.findIndex((e, i) => i > 0 && e.includes('class="tooltiptext2"') && splitBody[i + 1].startsWith("Puntos"));
	if (staffPoints == -1) staffPoints = false;
	else staffPoints = parseNumber(splitBody[staffPoints + 1].replace("Puntos:", ""));

	const botsIndexes = splitBody.map((e, i) => {
		if (e.includes('class="dthings-card__flex__banner')) return i;
	}).filter(e => e);

	const bots = botsIndexes.map(e => {
		
		const bodySliced = splitBody.slice(e);
		const votesInvites = bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__description"')) + 1].split(" | ");
		try { let avatar = formatHTML(splitBody[e + 2]).match(/https:.+"\)/g)[0].slice(0, -2); }
		catch { let avatar = formatHTML(splitBody[e + 2]).match(/https:.+/g)[0]; }
		
		return {
			username: formatHTML(bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__username"')) + 1]),
			id: bodySliced.find(e => e.includes('<a style')).match(/\d{3,}/g)[0],
			avatar: clearAvatarLink(avatar),
			description: formatHTML(bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__sectionText"')) + 1]),
			votes: parseNumber(votesInvites[0].replace("Votos: ", "")),
			invites: parseNumber(votesInvites[1].replace("Invites: ", "")),
			botbug: bodySliced.slice(0, 10).join().includes("bugbot-dthings.png"),
			certified: bodySliced.slice(0, 10).join().includes("certifiedbot-dthings.png"),
		}

	});

	return {
		username: formatHTML(splitBody[splitBody.findIndex((e, i) => i > 0 && splitBody[i - 1].includes('class="dthings__main__title mt-2') && e.startsWith('<b')) + 1]),
		id: userID,
		avatar,
		description: formatHTML(splitBody[splitBody.findIndex(e => e.includes('class="lead dthings__main__subtitle mb-2"')) + 1]),
		staffPoints,
		badges: splitBody.filter(e => e.includes('onerror="imgError(this);"') && e.includes('class="mr-1"')).map(e => splitBody[splitBody.indexOf(e) + 2]),
		dtBadges: splitBody.filter(e => e.includes('<img draggable="false"') && e.includes('width="25px">') && !e.includes('onerror="imgError(this);"') && !e.includes('class="mr-1";')).map(e => {
			const badge = splitBody[splitBody.indexOf(e) + 2];
			if (badge.startsWith("Puntos")) return 0;
			return badge;
		}).filter(e => e),
		bots
	}

}

module.exports = scrape;
