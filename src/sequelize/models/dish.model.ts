import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class Dish extends Model {};

    Dish.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(65),
            allowNull: false
        },
        isALaCarte: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        modelName: "dish",
        tableName: "dish",
        underscored: true,
        paranoid: true,
        sequelize
    });
};