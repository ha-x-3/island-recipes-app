package com.islandrecipes.island_recipes_app.models;

import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
public class NutritionalData {
    private double calories;
    private TotalNutrients totalNutrients;

    @Getter
    @Setter
    public static class TotalNutrients {
        @JsonProperty("FAT")
        private NutrientInfo fat;
        @JsonProperty("PROCNT")
        private NutrientInfo protein;
        @JsonProperty("CHOLE")
        private NutrientInfo cholesterol;
        @JsonProperty("NA")
        private NutrientInfo sodium;
    }

    @Getter
    @Setter
    public static class NutrientInfo {
        private String label;
        private double quantity;
        private String unit;
    }
    
}