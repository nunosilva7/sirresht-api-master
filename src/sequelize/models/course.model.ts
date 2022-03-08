import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {
    
    class Course extends Model {};

    Course.init({
        id: {
            type: DataTypes.TINYINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.ENUM("starter", "main", "dessert"),
            allowNull: false
        }
    }, {
        modelName: "course",
        tableName: "course",
        underscored: true,
        timestamps: false,
        sequelize
    });
}