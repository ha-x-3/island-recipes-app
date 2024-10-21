package com.islandrecipes.island_recipes_app.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NutritionalData {

    private double calories;
    private TotalNutrients totalNutrients;

    @Getter
    @Setter
    public static class TotalNutrients {
        private Nutrient FAT;
        private Nutrient PROCNT;
        private Nutrient CHOLE;
        private Nutrient NA;
    }

    @Getter
    @Setter
    public static class Nutrient {
        private double quantity;
        private String unit;
    }
}
