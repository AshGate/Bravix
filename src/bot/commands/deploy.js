import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('Déployer les commandes slash (Admin seulement)'),

    execute: async (interaction) => {
        // Vérifier si l'utilisateur est l'admin principal ou a les permissions
        const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
        const hasAdminPerms = interaction.member.permissions.has('Administrator');
        
        if (!isMainAdmin && !hasAdminPerms) {
            return interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const commands = [];
            const commandsPath = join(__dirname, '../commands');
            const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                if (file === 'deploy.js') continue;
                
                const filePath = join(commandsPath, file);
                const fileUrl = new URL(`file://${filePath.replace(/\\/g, '/')}`);
                const command = await import(fileUrl.href);
                if (command.default?.data) {
                    commands.push(command.default.data.toJSON());
                }
            }

            const rest = new REST().setToken(process.env.DISCORD_TOKEN);

            // Déployer globalement au lieu d'un serveur spécifique
            const data = await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );

            await interaction.editReply({
                content: `✅ ${data.length} commandes slash ont été déployées globalement sur tous les serveurs!`
            });

        } catch (error) {
            console.error('Erreur lors du déploiement:', error);
            await interaction.editReply({
                content: '❌ Erreur lors du déploiement des commandes.'
            });
        }
    }
};