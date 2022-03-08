import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class Menu extends Model {};

    Menu.init({
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
        price: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false
        },
        openReservations: {
            type: DataTypes.INTEGER({ length: 2 }).UNSIGNED,
            allowNull: false
        }
    }, {
        modelName: "menu",
        tableName: "menu",
        underscored: true,
        paranoid: true,
        sequelize
    });
};