package com.islandrecipes.island_recipes_app.repositories;

import com.islandrecipes.island_recipes_app.models.Recipe;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface RecipeRepository extends MongoRepository<Recipe, String> {

    // Custom query to search by recipe name and ingredients name using regex
    @Query("{'$or': [{'recipeName': {$regex: ?0, $options: 'i'}}, {'ingredients.name': {$regex: ?0, $options: 'i'}}]}")
    List<Recipe> searchRecipesByNameOrIngredient(String searchTerm);

}
