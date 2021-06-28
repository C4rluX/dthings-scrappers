// Con este scrapper puedes obtener información de algún usuario registrado en la botlist mediante su ID

// Ejemplo de como usarlo:

/*

	const dtUserInfo = require("./userInfo.js");
	dtUserInfo("654118072285921281")
		.then(bot => console.log(user))
		.catch(err => console.log(error))

*/

const fetch = require("node-fetch");

const scrape = async (userID = "") => {

	if (!userID) { throw "Invalid user ID" }
	if (typeof userID !== "string") { throw "Invalid user ID, must be a string" }

	const response = await fetch("https://discordthings.com/u/" + userID)
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

	const votes = splitBody[splitBody.indexOf('<span class="heading has-text-white">') + 1];
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
	

	return {
		username: splitBody[splitBody.findIndex(e => e.includes('class="UserName is-size-5 has-text-white"')) + 1],
		id: userID,
		description: splitBody[splitBody.indexOf('<p class="has-text-white">') + 1],
		votes: parseInt(votes),
		lastSession: splitBody[splitBody.findIndex((e, i) => e.includes('<span class="heading has-text-white">') && splitBody[i - 1] == '<div>') + 1],
		staffPoints,
		badges,
		discordBadges: splitBody.filter( (e, i) => splitBody[i - 1] == '<span class="tooltiptext">' && splitBody[i - 2].includes("discord.com/assets/")),
		bots: splitBody.filter(e => e.includes('<a title=') && e.includes('class="cardBtn1"')).map(e => e.match(/\d{3,}/g)[0]),
	}

}

module.exports = scrape;
