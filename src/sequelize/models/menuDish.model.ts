import { Sequelize, DataTypes, Model } from "sequelize";

export default (sequelize: Sequelize): void => {

    class MenuDish extends Model {};

    MenuDish.init({
        menuId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: sequelize.models.menu,
                key: 'id'
            }
        },
        dishId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: sequelize.models.dish,
                key: 'id'
            }
        },
        dishQuantity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        }
    }, {
        modelName: "menuDish",
        tableName: "menu-dish",
        underscored: true,
        timestamps: false,
        sequelize
    });
};