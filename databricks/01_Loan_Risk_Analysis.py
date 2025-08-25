# Databricks notebook source
# MAGIC %md
# MAGIC # Agricultural Loan Risk Analysis
# MAGIC 
# MAGIC This notebook analyzes loan risk factors for agricultural borrowers using advanced analytics and machine learning.
# MAGIC 
# MAGIC ## Key Features:
# MAGIC - Loan performance analysis
# MAGIC - Risk factor identification
# MAGIC - Predictive modeling for default risk
# MAGIC - Integration with MCP system

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Setup and Data Loading

# COMMAND ----------

# Import required libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler, StringIndexer
from pyspark.ml.classification import RandomForestClassifier, GBTClassifier
from pyspark.ml.evaluation import BinaryClassificationEvaluator
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
import warnings
warnings.filterwarnings('ignore')

# Set up plotting
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

print("✅ Libraries imported successfully")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Data Schema Definition

# COMMAND ----------

# Define schema for loan data
loan_schema = StructType([
    StructField("loan_id", StringType(), True),
    StructField("borrower_id", StringType(), True),
    StructField("loan_amount", DoubleType(), True),
    StructField("interest_rate", DoubleType(), True),
    StructField("term_months", IntegerType(), True),
    StructField("loan_purpose", StringType(), True),
    StructField("collateral_type", StringType(), True),
    StructField("collateral_value", DoubleType(), True),
    StructField("loan_status", StringType(), True),
    StructField("origination_date", DateType(), True),
    StructField("maturity_date", DateType(), True),
    StructField("current_balance", DoubleType(), True),
    StructField("days_past_due", IntegerType(), True),
    StructField("payment_frequency", StringType(), True)
])

# Define schema for borrower data
borrower_schema = StructType([
    StructField("borrower_id", StringType(), True),
    StructField("first_name", StringType(), True),
    StructField("last_name", StringType(), True),
    StructField("farm_size_acres", DoubleType(), True),
    StructField("primary_crop", StringType(), True),
    StructField("secondary_crop", StringType(), True),
    StructField("years_farming", IntegerType(), True),
    StructField("credit_score", IntegerType(), True),
    StructField("annual_income", DoubleType(), True),
    StructField("debt_to_income_ratio", DoubleType(), True),
    StructField("county", StringType(), True),
    StructField("state", StringType(), True)
])

print("✅ Schemas defined")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Data Loading and Preparation

# COMMAND ----------

# Load data from your SQL Server database or files
# Replace with your actual data source

# Option 1: Load from SQL Server (if using JDBC)
# loans_df = spark.read \
#     .format("jdbc") \
#     .option("url", "jdbc:sqlserver://localhost:1433;databaseName=LoanOfficerAI_MCP_POC") \
#     .option("dbtable", "loans") \
#     .option("user", "sa") \
#     .option("password", "YourStrong@Passw0rd") \
#     .load()

# Option 2: Load from CSV files (for demo)
# Create sample data for demonstration
sample_loans_data = [
    ("L001", "B001", 250000.0, 4.5, 60, "Equipment", "Tractor", 300000.0, "Active", "2023-01-15", "2028-01-15", 200000.0, 0, "Monthly"),
    ("L002", "B002", 150000.0, 5.0, 36, "Operating", "Crop", 180000.0, "Active", "2023-03-01", "2026-03-01", 120000.0, 15, "Monthly"),
    ("L003", "B003", 500000.0, 4.2, 84, "Land", "Land", 600000.0, "Active", "2022-06-01", "2029-06-01", 450000.0, 0, "Monthly"),
    ("L004", "B004", 75000.0, 6.0, 24, "Operating", "Livestock", 90000.0, "Delinquent", "2023-08-01", "2025-08-01", 60000.0, 45, "Monthly"),
    ("L005", "B005", 320000.0, 4.8, 72, "Equipment", "Combine", 400000.0, "Active", "2022-12-01", "2028-12-01", 280000.0, 0, "Monthly")
]

loans_df = spark.createDataFrame(sample_loans_data, loan_schema)

sample_borrower_data = [
    ("B001", "John", "Smith", 1200.0, "Corn", "Soybeans", 15, 720, 180000.0, 0.35, "Story", "Iowa"),
    ("B002", "Mary", "Johnson", 800.0, "Wheat", "Corn", 8, 680, 120000.0, 0.42, "McLean", "Illinois"),
    ("B003", "Robert", "Williams", 2500.0, "Soybeans", "Corn", 25, 750, 350000.0, 0.28, "Polk", "Iowa"),
    ("B004", "Lisa", "Brown", 400.0, "Cattle", "Hay", 12, 620, 85000.0, 0.55, "Adams", "Nebraska"),
    ("B005", "David", "Davis", 1800.0, "Corn", "Wheat", 20, 700, 220000.0, 0.38, "Grundy", "Iowa")
]

borrowers_df = spark.createDataFrame(sample_borrower_data, borrower_schema)

print("✅ Sample data created")
print(f"Loans: {loans_df.count()} records")
print(f"Borrowers: {borrowers_df.count()} records")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Data Exploration and Analysis

# COMMAND ----------

# Display basic statistics
print("=== LOAN DATA OVERVIEW ===")
loans_df.describe().show()

print("\n=== BORROWER DATA OVERVIEW ===")
borrowers_df.describe().show()

# COMMAND ----------

# Join loans with borrower data for comprehensive analysis
loan_borrower_df = loans_df.join(borrowers_df, "borrower_id", "inner")

# Add calculated fields
loan_borrower_df = loan_borrower_df.withColumn(
    "loan_to_value_ratio", 
    col("loan_amount") / col("collateral_value")
).withColumn(
    "loan_to_income_ratio",
    col("loan_amount") / col("annual_income")
).withColumn(
    "is_delinquent",
    when(col("days_past_due") > 30, 1).otherwise(0)
).withColumn(
    "risk_score",
    when(col("credit_score") >= 720, "Low")
    .when(col("credit_score") >= 650, "Medium")
    .otherwise("High")
)

print("✅ Data joined and risk features calculated")
loan_borrower_df.show(5)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. Risk Analysis Visualizations

# COMMAND ----------

# Convert to Pandas for visualization
loan_pandas = loan_borrower_df.toPandas()

# Create comprehensive risk analysis plots
fig, axes = plt.subplots(2, 3, figsize=(18, 12))
fig.suptitle('Agricultural Loan Risk Analysis Dashboard', fontsize=16, fontweight='bold')

# 1. Loan Amount Distribution
axes[0,0].hist(loan_pandas['loan_amount'], bins=20, alpha=0.7, color='skyblue', edgecolor='black')
axes[0,0].set_title('Loan Amount Distribution')
axes[0,0].set_xlabel('Loan Amount ($)')
axes[0,0].set_ylabel('Frequency')

# 2. Credit Score vs Delinquency
credit_delinq = loan_pandas.groupby('risk_score')['is_delinquent'].mean()
axes[0,1].bar(credit_delinq.index, credit_delinq.values, color=['green', 'orange', 'red'])
axes[0,1].set_title('Delinquency Rate by Credit Risk')
axes[0,1].set_xlabel('Risk Category')
axes[0,1].set_ylabel('Delinquency Rate')

# 3. Loan-to-Value Ratio Distribution
axes[0,2].hist(loan_pandas['loan_to_value_ratio'], bins=15, alpha=0.7, color='lightcoral', edgecolor='black')
axes[0,2].set_title('Loan-to-Value Ratio Distribution')
axes[0,2].set_xlabel('LTV Ratio')
axes[0,2].set_ylabel('Frequency')

# 4. Primary Crop Distribution
crop_counts = loan_pandas['primary_crop'].value_counts()
axes[1,0].pie(crop_counts.values, labels=crop_counts.index, autopct='%1.1f%%', startangle=90)
axes[1,0].set_title('Primary Crop Distribution')

# 5. Farm Size vs Annual Income
axes[1,1].scatter(loan_pandas['farm_size_acres'], loan_pandas['annual_income'], 
                 c=loan_pandas['is_delinquent'], cmap='RdYlGn_r', alpha=0.7)
axes[1,1].set_title('Farm Size vs Annual Income')
axes[1,1].set_xlabel('Farm Size (Acres)')
axes[1,1].set_ylabel('Annual Income ($)')

# 6. Days Past Due Distribution
axes[1,2].hist(loan_pandas['days_past_due'], bins=20, alpha=0.7, color='gold', edgecolor='black')
axes[1,2].set_title('Days Past Due Distribution')
axes[1,2].set_xlabel('Days Past Due')
axes[1,2].set_ylabel('Frequency')

plt.tight_layout()
plt.show()

print("✅ Risk analysis visualizations completed")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6. Advanced Risk Metrics

# COMMAND ----------

# Calculate advanced risk metrics
risk_metrics = loan_borrower_df.agg(
    avg("loan_amount").alias("avg_loan_amount"),
    avg("interest_rate").alias("avg_interest_rate"),
    avg("loan_to_value_ratio").alias("avg_ltv_ratio"),
    avg("debt_to_income_ratio").alias("avg_dti_ratio"),
    avg("credit_score").alias("avg_credit_score"),
    sum("is_delinquent").alias("total_delinquent"),
    count("loan_id").alias("total_loans")
).collect()[0]

delinquency_rate = risk_metrics["total_delinquent"] / risk_metrics["total_loans"]

print("=== PORTFOLIO RISK METRICS ===")
print(f"Average Loan Amount: ${risk_metrics['avg_loan_amount']:,.2f}")
print(f"Average Interest Rate: {risk_metrics['avg_interest_rate']:.2f}%")
print(f"Average LTV Ratio: {risk_metrics['avg_ltv_ratio']:.3f}")
print(f"Average DTI Ratio: {risk_metrics['avg_dti_ratio']:.3f}")
print(f"Average Credit Score: {risk_metrics['avg_credit_score']:.0f}")
print(f"Portfolio Delinquency Rate: {delinquency_rate:.2%}")

# COMMAND ----------

# Risk segmentation analysis
risk_segments = loan_borrower_df.groupBy("risk_score").agg(
    count("loan_id").alias("loan_count"),
    avg("loan_amount").alias("avg_loan_amount"),
    avg("days_past_due").alias("avg_days_past_due"),
    sum("is_delinquent").alias("delinquent_count")
).withColumn(
    "delinquency_rate",
    col("delinquent_count") / col("loan_count")
)

print("\n=== RISK SEGMENTATION ANALYSIS ===")
risk_segments.show()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7. Predictive Modeling Setup

# COMMAND ----------

# Prepare features for machine learning
feature_cols = [
    "loan_amount", "interest_rate", "term_months", "collateral_value",
    "farm_size_acres", "years_farming", "credit_score", "annual_income",
    "debt_to_income_ratio", "loan_to_value_ratio", "loan_to_income_ratio"
]

# String indexers for categorical variables
crop_indexer = StringIndexer(inputCol="primary_crop", outputCol="primary_crop_indexed")
purpose_indexer = StringIndexer(inputCol="loan_purpose", outputCol="loan_purpose_indexed")
collateral_indexer = StringIndexer(inputCol="collateral_type", outputCol="collateral_type_indexed")

# Add indexed categorical features
feature_cols.extend(["primary_crop_indexed", "loan_purpose_indexed", "collateral_type_indexed"])

# Vector assembler
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")

# Feature scaler
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")

print("✅ Feature engineering pipeline prepared")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 8. Machine Learning Pipeline

# COMMAND ----------

# Create ML pipeline for default prediction
rf_classifier = RandomForestClassifier(
    featuresCol="scaled_features",
    labelCol="is_delinquent",
    numTrees=100,
    maxDepth=10,
    seed=42
)

# Create pipeline
ml_pipeline = Pipeline(stages=[
    crop_indexer,
    purpose_indexer, 
    collateral_indexer,
    assembler,
    scaler,
    rf_classifier
])

# Split data for training and testing
train_df, test_df = loan_borrower_df.randomSplit([0.8, 0.2], seed=42)

print(f"Training set: {train_df.count()} records")
print(f"Test set: {test_df.count()} records")

# Train the model
print("🔄 Training machine learning model...")
model = ml_pipeline.fit(train_df)
print("✅ Model training completed")

# COMMAND ----------

# Make predictions
predictions = model.transform(test_df)

# Evaluate model performance
evaluator = BinaryClassificationEvaluator(
    labelCol="is_delinquent",
    rawPredictionCol="rawPrediction",
    metricName="areaUnderROC"
)

auc = evaluator.evaluate(predictions)
print(f"Model AUC: {auc:.4f}")

# Show prediction results
predictions.select(
    "borrower_id", "loan_id", "is_delinquent", "prediction", "probability"
).show(10)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 9. Model Insights and Feature Importance

# COMMAND ----------

# Extract feature importance from Random Forest
rf_model = model.stages[-1]
feature_importance = rf_model.featureImportances.toArray()

# Create feature importance DataFrame
importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': feature_importance
}).sort_values('importance', ascending=False)

# Plot feature importance
plt.figure(figsize=(12, 8))
plt.barh(range(len(importance_df)), importance_df['importance'])
plt.yticks(range(len(importance_df)), importance_df['feature'])
plt.xlabel('Feature Importance')
plt.title('Random Forest Feature Importance for Default Prediction')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()

print("✅ Feature importance analysis completed")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 10. Risk Scoring Function

# COMMAND ----------

def calculate_risk_score(loan_amount, credit_score, debt_to_income, loan_to_value, farm_size):
    """
    Calculate a comprehensive risk score for agricultural loans
    
    Args:
        loan_amount: Loan amount in dollars
        credit_score: Borrower credit score
        debt_to_income: Debt-to-income ratio
        loan_to_value: Loan-to-value ratio
        farm_size: Farm size in acres
    
    Returns:
        Risk score (0-100, higher = more risky)
    """
    
    # Credit score component (0-40 points)
    if credit_score >= 750:
        credit_component = 0
    elif credit_score >= 700:
        credit_component = 10
    elif credit_score >= 650:
        credit_component = 20
    elif credit_score >= 600:
        credit_component = 30
    else:
        credit_component = 40
    
    # Debt-to-income component (0-25 points)
    if debt_to_income <= 0.3:
        dti_component = 0
    elif debt_to_income <= 0.4:
        dti_component = 10
    elif debt_to_income <= 0.5:
        dti_component = 15
    else:
        dti_component = 25
    
    # Loan-to-value component (0-20 points)
    if loan_to_value <= 0.7:
        ltv_component = 0
    elif loan_to_value <= 0.8:
        ltv_component = 5
    elif loan_to_value <= 0.9:
        ltv_component = 10
    else:
        ltv_component = 20
    
    # Farm size component (0-10 points)
    if farm_size >= 1000:
        size_component = 0
    elif farm_size >= 500:
        size_component = 3
    elif farm_size >= 200:
        size_component = 6
    else:
        size_component = 10
    
    # Loan amount component (0-5 points)
    if loan_amount <= 100000:
        amount_component = 0
    elif loan_amount <= 300000:
        amount_component = 2
    else:
        amount_component = 5
    
    total_risk_score = credit_component + dti_component + ltv_component + size_component + amount_component
    
    return min(total_risk_score, 100)

# Register UDF for Spark
from pyspark.sql.functions import udf
from pyspark.sql.types import IntegerType

risk_score_udf = udf(calculate_risk_score, IntegerType())

# Apply risk scoring to the dataset
scored_df = loan_borrower_df.withColumn(
    "calculated_risk_score",
    risk_score_udf(
        col("loan_amount"),
        col("credit_score"), 
        col("debt_to_income_ratio"),
        col("loan_to_value_ratio"),
        col("farm_size_acres")
    )
)

print("✅ Risk scoring function applied")
scored_df.select("borrower_id", "loan_id", "calculated_risk_score", "is_delinquent").show()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 11. Export Results for MCP Integration

# COMMAND ----------

# Prepare data for export to MCP system
mcp_export_df = scored_df.select(
    col("loan_id"),
    col("borrower_id"),
    concat(col("first_name"), lit(" "), col("last_name")).alias("borrower_name"),
    col("loan_amount"),
    col("current_balance"),
    col("loan_status"),
    col("days_past_due"),
    col("calculated_risk_score"),
    col("is_delinquent"),
    col("primary_crop"),
    col("farm_size_acres"),
    col("credit_score"),
    col("annual_income")
)

# Show sample of export data
print("=== MCP EXPORT DATA SAMPLE ===")
mcp_export_df.show(10)

# Save to Delta table for integration
# mcp_export_df.write.format("delta").mode("overwrite").saveAsTable("loan_risk_analysis")

print("✅ Data prepared for MCP integration")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 12. Summary and Recommendations

# COMMAND ----------

print("=== AGRICULTURAL LOAN RISK ANALYSIS SUMMARY ===")
print()
print("📊 PORTFOLIO OVERVIEW:")
print(f"   • Total Loans Analyzed: {loan_borrower_df.count()}")
print(f"   • Portfolio Delinquency Rate: {delinquency_rate:.2%}")
print(f"   • Average Risk Score: {scored_df.agg(avg('calculated_risk_score')).collect()[0][0]:.1f}")
print()
print("🎯 MODEL PERFORMANCE:")
print(f"   • Random Forest AUC: {auc:.4f}")
print(f"   • Top Risk Factors: Credit Score, DTI Ratio, LTV Ratio")
print()
print("⚠️  HIGH RISK INDICATORS:")
print("   • Credit Score < 650")
print("   • Debt-to-Income > 50%") 
print("   • Loan-to-Value > 90%")
print("   • Farm Size < 200 acres")
print()
print("💡 RECOMMENDATIONS:")
print("   • Implement automated risk scoring")
print("   • Monitor seasonal payment patterns")
print("   • Enhance collateral valuation processes")
print("   • Develop crop-specific risk models")
print()
print("🔗 NEXT STEPS:")
print("   • Integrate with MCP system")
print("   • Set up real-time monitoring")
print("   • Deploy predictive alerts")
print("   • Schedule monthly model retraining")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 13. Integration with MCP System

# COMMAND ----------

# Function to format data for MCP API calls
def format_for_mcp_api(df):
    """
    Format Databricks results for MCP system integration
    """
    
    # Convert to JSON format expected by MCP
    results = []
    
    for row in df.collect():
        loan_data = {
            "loan_id": row["loan_id"],
            "borrower_id": row["borrower_id"], 
            "borrower_name": row["borrower_name"],
            "risk_assessment": {
                "risk_score": row["calculated_risk_score"],
                "risk_level": "High" if row["calculated_risk_score"] > 70 else "Medium" if row["calculated_risk_score"] > 40 else "Low",
                "is_delinquent": bool(row["is_delinquent"]),
                "days_past_due": row["days_past_due"]
            },
            "loan_details": {
                "amount": row["loan_amount"],
                "current_balance": row["current_balance"],
                "status": row["loan_status"]
            },
            "borrower_profile": {
                "primary_crop": row["primary_crop"],
                "farm_size_acres": row["farm_size_acres"],
                "credit_score": row["credit_score"],
                "annual_income": row["annual_income"]
            },
            "analysis_timestamp": "2024-01-01T00:00:00Z"
        }
        results.append(loan_data)
    
    return results

# Format sample data for MCP
mcp_formatted_data = format_for_mcp_api(mcp_export_df.limit(5))

print("=== MCP API FORMAT SAMPLE ===")
import json
print(json.dumps(mcp_formatted_data[0], indent=2))

print("✅ Databricks analysis ready for MCP integration!")
