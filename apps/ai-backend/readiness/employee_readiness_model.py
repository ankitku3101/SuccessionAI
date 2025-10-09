"""
Employee Readiness ML Model

This module trains and provides predictions for employee readiness classification.
Uses scikit-learn for training a classification model on employee features.
"""

import json
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline
from dataclasses import dataclass
import os

@dataclass
class EmployeeFeatures:
    """Features for employee readiness prediction."""
    performance_rating: float
    potential_rating: float
    leadership_score: int
    missing_skills_count: int
    technical_score: int
    communication_score: int
    experience_years: int

@dataclass
class ReadinessPrediction:
    """Employee readiness prediction result."""
    employee_id: str
    predicted_readiness: str
    confidence: float
    probabilities: Dict[str, float]

class EmployeeReadinessModel:
    """ML model for employee readiness classification."""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'performance_rating', 'potential_rating', 'leadership_score',
            'missing_skills_count', 'technical_score', 'communication_score',
            'experience_years'
        ]
        self.class_names = ['Developing', 'Not Ready', 'Ready']  # Alphabetical order
        self.model_path = "models/employee_readiness_model_v2.pkl"
        self.scaler_path = "models/employee_readiness_scaler.pkl"
    
    def load_training_data(self, file_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """Load and preprocess training data."""
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Extract features and targets
        features = []
        targets = []
        
        for record in data['training_data']:
            feat = record['features']
            
            # Build simplified feature vector
            feature_vector = [
                feat['performance_rating'],
                feat['potential_rating'],
                feat['leadership_score'],
                feat['missing_skills_count'],
                feat['technical_score'],
                feat['communication_score'],
                feat['experience_years']
            ]
            
            features.append(feature_vector)
            targets.append(record['readiness_status'])
        
        return np.array(features), np.array(targets)
    
    def train_model(self, file_path: str) -> Dict[str, Any]:
        """Train the employee readiness classification model."""
        print("Loading training data...")
        X, y = self.load_training_data(file_path)
        
        print(f"Training data shape: {X.shape}")
        print(f"Class distribution: {np.unique(y, return_counts=True)}")
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Create and train the model with hyperparameter tuning
        print("Training Random Forest model with hyperparameter tuning...")
        
        # Define parameter grid for tuning
        param_grid = {
            'classifier__n_estimators': [100, 200],
            'classifier__max_depth': [10, 15, None],
            'classifier__min_samples_split': [2, 5],
            'classifier__min_samples_leaf': [1, 2],
            'classifier__class_weight': ['balanced', None]
        }
        
        # Create pipeline
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', RandomForestClassifier(random_state=42))
        ])
        
        # Grid search
        grid_search = GridSearchCV(
            pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1
        )
        grid_search.fit(X_train, y_train)
        
        # Best model
        self.model = grid_search.best_estimator_
        self.scaler = self.model.named_steps['scaler']
        
        print(f"Best parameters: {grid_search.best_params_}")
        print(f"Best cross-validation score: {grid_search.best_score_:.4f}")
        
        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        test_accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Test accuracy: {test_accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance
        classifier = self.model.named_steps['classifier']
        feature_importance = classifier.feature_importances_
        feature_importance_dict = dict(zip(self.feature_names, feature_importance))
        
        print("\nFeature Importance:")
        for feature, importance in sorted(feature_importance_dict.items(), 
                                        key=lambda x: x[1], reverse=True):
            print(f"  {feature}: {importance:.4f}")
        
        # Save the model
        self.save_model()
        
        return {
            "test_accuracy": test_accuracy,
            "best_params": grid_search.best_params_,
            "best_cv_score": grid_search.best_score_,
            "feature_importance": feature_importance_dict,
            "classification_report": classification_report(y_test, y_pred, output_dict=True)
        }
    
    def save_model(self):
        """Save the trained model and scaler."""
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print(f"Model saved to: {self.model_path}")
    
    def load_model(self):
        """Load the trained model."""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.scaler = self.model.named_steps['scaler']
            print("Model loaded successfully")
            return True
        else:
            print("No trained model found. Please train the model first.")
            return False
    
    def predict_readiness(self, features: EmployeeFeatures, employee_id: str = None) -> ReadinessPrediction:
        """Predict employee readiness status."""
        if self.model is None:
            if not self.load_model():
                raise ValueError("No trained model available")
        
        # Build simplified feature vector
        feature_vector = np.array([[
            features.performance_rating,
            features.potential_rating,
            features.leadership_score,
            features.missing_skills_count,
            features.technical_score,
            features.communication_score,
            features.experience_years
        ]])
        
        # Make prediction
        prediction = self.model.predict(feature_vector)[0]
        probabilities = self.model.predict_proba(feature_vector)[0]
        confidence = max(probabilities)
        
        # Create probability dictionary
        prob_dict = {class_name: prob for class_name, prob in zip(self.class_names, probabilities)}
        
        return ReadinessPrediction(
            employee_id=employee_id or "Unknown",
            predicted_readiness=prediction,
            confidence=confidence,
            probabilities=prob_dict
        )
    
def main():
    """Train the employee readiness model."""
    model = EmployeeReadinessModel()
    
    # Train the model
    results = model.train_model("data/employee_readiness_training_data.json")
    
    print("\n" + "="*50)
    print("MODEL TRAINING COMPLETE")
    print("="*50)
    
    # Test prediction on a sample
    sample_features = EmployeeFeatures(
        performance_rating=4.0,
        potential_rating=4.2,
        leadership_score=72,
        missing_skills_count=2,
        technical_score=85,
        communication_score=78,
        experience_years=4
    )
    
    prediction = model.predict_readiness(sample_features, "TEST_001")
    
    print(f"\nSample Prediction:")
    print(f"  Employee ID: {prediction.employee_id}")
    print(f"  Predicted Readiness: {prediction.predicted_readiness}")
    print(f"  Confidence: {prediction.confidence:.2f}")
    print(f"  Probabilities: {prediction.probabilities}")

if __name__ == "__main__":
    main()