import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class Role extends Model {};

    Role.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        desc: {
            type: DataTypes.ENUM("admin", "user"),
            allowNull: false
        }
    }, {
        modelName: "role",
        tableName: "role",
        underscored: true,
        timestamps: false,
        sequelize
    });
};