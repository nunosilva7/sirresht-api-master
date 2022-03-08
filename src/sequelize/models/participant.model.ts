import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class Participant extends Model {};

    Participant.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        reservationPrice: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false
        },
        amountPaid: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
    }, {
        modelName: "participant",
        tableName: "participant",
        underscored: true,
        paranoid: true,
        sequelize
    });
};