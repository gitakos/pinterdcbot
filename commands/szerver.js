const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('szerver')
		.setDescription('Információ a szerverről'),
	async execute(interaction) {
		await interaction.reply(`Ez a szerver ${interaction.guild.name} és van neki ${interaction.guild.memberCount} tagja.`);
	},
};