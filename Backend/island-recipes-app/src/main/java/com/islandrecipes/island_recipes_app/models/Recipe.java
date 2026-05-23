package com.islandrecipes.island_recipes_app.models;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "Recipe name is required")
    private String recipeName;

    @Min(value = 1, message = "Yield must be at least 1")
    private int yield;

    @Min(value = 0, message = "Prep time hours must be non-negative")
    private int prepTimeHour;

    @Min(value = 0, message = "Prep time minutes must be non-negative")
    private int prepTimeMin;

    @Min(value = 0, message = "Cook time hours must be non-negative")
    private int cookTimeHour;

    @Min(value = 0, message = "Cook time minutes must be non-negative")
    private int cookTimeMin;

    @NotNull(message = "Ingredients are required")
    @Valid
    private List<Ingredient> ingredients;

    @NotBlank(message = "Instructions are required")
    private String instructions;

    private String recipePhotoUrl;
    private NutritionalData nutritionalData;
    private List<String> tags;

    @Setter
    @Getter
    public static class Ingredient {
        @NotBlank(message = "Ingredient name is required")
        private String name;
        private double amount;
        private String unit;
    }

}
