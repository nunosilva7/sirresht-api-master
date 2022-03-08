import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class ParticipantDish extends Model {};

    ParticipantDish.init({
        participantId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: sequelize.models.participant,
                key: 'id'
            }
        },
        dishId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: sequelize.models.dish,
                key: 'id'
            }
        }
    }, {
        modelName: "participantDish",
        tableName: "participant-dish",
        underscored: true,
        timestamps: false,
        sequelize
    });
};