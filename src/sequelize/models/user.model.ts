import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class User extends Model {};

    User.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        hashedPassword: {
            type: DataTypes.STRING(60, true),
        },
        avatarReference: {
            type: DataTypes.TEXT
        },
        discount_id:{
            type: DataTypes.TINYINT.UNSIGNED,
        },
    }, {
        modelName: "user",
        tableName: "user",
        underscored: true,
        paranoid: true,
        sequelize
    });
};