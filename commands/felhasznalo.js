const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('felhasznalo')
		.setDescription('Információ a felhasználóról'),
	async execute(interaction) {
		await interaction.reply(`Ez a parancs ${interaction.user.username} által lett lefuttatva, aki ${interaction.member.joinedAt} dátumon csatlakozott a szerverhez, felhasználó id-ja: ${interaction.user.id}`);
	},
};