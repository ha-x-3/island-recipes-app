package com.islandrecipes.island_recipes_app.repositories;

import com.islandrecipes.island_recipes_app.models.Recipe;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RecipeRepository extends MongoRepository<Recipe, String> {
}
