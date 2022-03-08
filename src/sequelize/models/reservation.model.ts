import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class Reservation extends Model {};

    Reservation.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        reservationPrice: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        supplementsPrice: {
            type: DataTypes.DECIMAL(5, 2),
        },
        amountReceived: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
        },
        message: {
            type: DataTypes.TEXT
        },
        isTableCommunal: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        }
    }, {
        modelName: "reservation",
        tableName: "reservation",
        underscored: true,
        paranoid: true,
        sequelize
    });
};