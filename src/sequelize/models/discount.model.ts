import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {
    
    class Discount extends Model {};

    Discount.init({
        id: {
            type: DataTypes.TINYINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: false
        },
        percentage: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false
        },
    }, {
        modelName: "discount",
        tableName: "discount",
        underscored: true,
        timestamps: false,
        sequelize
    });
}