import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Créer un embed personnalisé avec des boutons')
        .addStringOption(option =>
            option.setName('titre')
                .setDescription('Titre de l\'embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description de l\'embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('couleur')
                .setDescription('Couleur de l\'embed (hex sans #)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL de l\'image à afficher')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('URL de la miniature')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('Texte du footer')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('boutons')
                .setDescription('Boutons (format: label1:style1:id1,label2:style2:id2) - styles: primary,secondary,success,danger')
                .setRequired(false)),

    execute: async (interaction) => {
        // Vérifier les permissions (Admin principal ou permissions serveur)
        const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
        const hasAdminPerms = interaction.member.permissions.has('Administrator');
        const hasModPerms = interaction.member.permissions.has('ManageMessages');

        if (!isMainAdmin && !hasAdminPerms && !hasModPerms) {
            return interaction.reply({
                content: '❌ Vous devez avoir des permissions de modération pour utiliser cette commande.',
                ephemeral: true
            });
        }

        try {
            const titre = interaction.options.getString('titre');
            const description = interaction.options.getString('description');
            const couleur = interaction.options.getString('couleur') || '5865F2';
            const image = interaction.options.getString('image');
            const thumbnail = interaction.options.getString('thumbnail');
            const footer = interaction.options.getString('footer');
            const boutonsString = interaction.options.getString('boutons');

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle(titre)
                .setDescription(description)
                .setColor(parseInt(couleur, 16))
                .setTimestamp();

            if (image) embed.setImage(image);
            if (thumbnail) embed.setThumbnail(thumbnail);
            if (footer) embed.setFooter({ text: footer });

            // Créer les boutons si spécifiés
            let components = [];
            if (boutonsString) {
                const boutons = boutonsString.split(',');
                const rows = [];
                let currentRow = new ActionRowBuilder();
                let buttonsInRow = 0;

                for (const boutonData of boutons) {
                    const [label, style, customId] = boutonData.split(':');
                    
                    if (!label || !style || !customId) {
                        continue;
                    }

                    // Convertir le style en ButtonStyle
                    let buttonStyle;
                    switch (style.toLowerCase()) {
                        case 'primary':
                        case 'bleu':
                            buttonStyle = ButtonStyle.Primary;
                            break;
                        case 'secondary':
                        case 'gris':
                            buttonStyle = ButtonStyle.Secondary;
                            break;
                        case 'success':
                        case 'vert':
                            buttonStyle = ButtonStyle.Success;
                            break;
                        case 'danger':
                        case 'rouge':
                            buttonStyle = ButtonStyle.Danger;
                            break;
                        default:
                            buttonStyle = ButtonStyle.Secondary;
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`embed_${customId}`)
                        .setLabel(label.trim())
                        .setStyle(buttonStyle);

                    currentRow.addComponents(button);
                    buttonsInRow++;

                    // Discord limite à 5 boutons par ligne
                    if (buttonsInRow === 5) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder();
                        buttonsInRow = 0;
                    }
                }

                // Ajouter la dernière ligne si elle contient des boutons
                if (buttonsInRow > 0) {
                    rows.push(currentRow);
                }

                components = rows;
            }

            // Envoyer l'embed
            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: false
            });

            // Envoyer un message de confirmation en privé
            await interaction.followUp({
                content: '✅ Embed créé avec succès !',
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur lors de la création de l\'embed:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la création de l\'embed. Vérifiez le format de vos paramètres.',
                ephemeral: true
            });
        }
    }
};