package com.islandrecipes.island_recipes_app.models;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Setter
@Getter
@Document(collection = "recipes")
public class Recipe {

    @Id
    private String id;
    private String recipeName;
    private int yield;
    private int prepTimeHour;
    private int prepTimeMin;
    private int cookTimeHour;
    private int cookTimeMin;
    private List<Ingredient> ingredients;
    private String instructions;
    private String recipePhotoUrl;
    private NutritionalData nutritionalData;

    @Setter
    @Getter
    public static class Ingredient {
        private String name;
        private double amount;
        private String unit;

    }

}
