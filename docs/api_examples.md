# P4 example API responses

*Generated from the real models with `apps/api/services/screening.py`. `guidance` trimmed to keys; `id/stored/queued_for_review` are added by the endpoint.*

## (a) Low — patient view

Input: `{"age": 30, "sex": "female", "height_cm": 162, "weight_kg": 55, "high_bp": false, "high_chol": false, "smoker": false, "phys_activity": true, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 1, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": false}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 21.0,
 "results": {
  "diabetes": {
   "band": "low",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "lowers",
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "BMI",
     "direction": "lowers",
     "text_key": "factor.BMI.lowers",
     "text": "Your body-mass index (BMI) made your answers less similar to people who have been told they have this condition."
    }
   ]
  },
  "heart": {
   "band": "low",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "Age",
     "direction": "lowers",
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "lowers",
     "text_key": "factor.HighBP.lowers",
     "text": "Having been told you have high blood pressure made your answers less similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": "low",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "Age",
     "direction": "lowers",
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "lowers",
     "text_key": "factor.HighBP.lowers",
     "text": "Having been told you have high blood pressure made your answers less similar to people who have been told they have this condition."
    }
   ]
  }
 },
 "shared_factors": [
  {
   "feature": "GenHlth",
   "diseases": {
    "diabetes": "lowers",
    "heart": "lowers",
    "stroke": "lowers"
   }
  },
  {
   "feature": "Age",
   "diseases": {
    "diabetes": "lowers",
    "heart": "lowers",
    "stroke": "lowers"
   }
  },
  {
   "feature": "HighBP",
   "diseases": {
    "heart": "lowers",
    "stroke": "lowers"
   }
  }
 ],
 "notes": [
  "age_under_40_less_reliable"
 ],
 "guidance": [
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "routine_checkup"
}
```

## (a) Low — clinician view

Input: `{"age": 30, "sex": "female", "height_cm": 162, "weight_kg": 55, "high_bp": false, "high_chol": false, "smoker": false, "phys_activity": true, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 1, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": false}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 21.0,
 "results": {
  "diabetes": {
   "band": "low",
   "probability": 0.0,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    0
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "shap": -1.1024504312904433,
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "lowers",
     "shap": -0.7785890260088476,
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "BMI",
     "direction": "lowers",
     "shap": -0.5320243427514726,
     "text_key": "factor.BMI.lowers",
     "text": "Your body-mass index (BMI) made your answers less similar to people who have been told they have this condition."
    }
   ]
  },
  "heart": {
   "band": "low",
   "probability": 0.0015,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    0
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "Age",
     "direction": "lowers",
     "shap": -1.0448805065826494,
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "shap": -0.5140267686276413,
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "lowers",
     "shap": -0.39623011936901115,
     "text_key": "factor.HighBP.lowers",
     "text": "Having been told you have high blood pressure made your answers less similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": "low",
   "probability": 0.0024,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    0
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "Age",
     "direction": "lowers",
     "shap": -1.039586102694936,
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "lowers",
     "shap": -0.7282671190478562,
     "text_key": "factor.GenHlth.lowers",
     "text": "How you rated your general health made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "lowers",
     "shap": -0.30738615640872163,
     "text_key": "factor.HighBP.lowers",
     "text": "Having been told you have high blood pressure made your answers less similar to people who have been told they have this condition."
    }
   ]
  }
 },
 "shared_factors": [
  {
   "feature": "GenHlth",
   "diseases": {
    "diabetes": "lowers",
    "heart": "lowers",
    "stroke": "lowers"
   }
  },
  {
   "feature": "Age",
   "diseases": {
    "diabetes": "lowers",
    "heart": "lowers",
    "stroke": "lowers"
   }
  },
  {
   "feature": "HighBP",
   "diseases": {
    "heart": "lowers",
    "stroke": "lowers"
   }
  }
 ],
 "notes": [
  "age_under_40_less_reliable"
 ],
 "guidance": [
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "routine_checkup",
 "queue_reasons": []
}
```

## (b) High — patient view

Input: `{"age": 68, "sex": "male", "height_cm": 162, "weight_kg": 88, "high_bp": true, "high_chol": true, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 4, "ment_health_days": 0, "phys_health_days": 15, "diff_walk": true}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 33.5,
 "results": {
  "diabetes": {
   "band": "high",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "BMI",
     "direction": "raises",
     "text_key": "factor.BMI.raises",
     "text": "Your body-mass index (BMI) made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "heart": {
   "band": "high",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "raises",
     "text_key": "factor.Age.raises",
     "text": "Your age group made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": "high",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "DiffWalk",
     "direction": "raises",
     "text_key": "factor.DiffWalk.raises",
     "text": "Difficulty walking or climbing stairs made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "raises",
     "text_key": "factor.Age.raises",
     "text": "Your age group made your answers more similar to people who have been told they have this condition."
    }
   ]
  }
 },
 "shared_factors": [
  {
   "feature": "GenHlth",
   "diseases": {
    "diabetes": "raises",
    "heart": "raises",
    "stroke": "raises"
   }
  },
  {
   "feature": "HighBP",
   "diseases": {
    "diabetes": "raises",
    "heart": "raises"
   }
  },
  {
   "feature": "Age",
   "diseases": {
    "heart": "raises",
    "stroke": "raises"
   }
  }
 ],
 "notes": [],
 "guidance": [
  "bmi_obese",
  "physical_activity",
  "tobacco",
  "blood_pressure",
  "cholesterol",
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "see_doctor_soon"
}
```

## (b) High — clinician view

Input: `{"age": 68, "sex": "male", "height_cm": 162, "weight_kg": 88, "high_bp": true, "high_chol": true, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 4, "ment_health_days": 0, "phys_health_days": 15, "diff_walk": true}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 33.5,
 "results": {
  "diabetes": {
   "band": "high",
   "probability": 0.5618,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    1
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "shap": 0.7132802575485638,
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "shap": 0.5859441838023015,
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "BMI",
     "direction": "raises",
     "shap": 0.49814127554088966,
     "text_key": "factor.BMI.raises",
     "text": "Your body-mass index (BMI) made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "heart": {
   "band": "high",
   "probability": 0.4459,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    1
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "shap": 0.7802418583748423,
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "raises",
     "shap": 0.5238460446119173,
     "text_key": "factor.Age.raises",
     "text": "Your age group made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "shap": 0.4078829088278095,
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": "high",
   "probability": 0.1473,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    1
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "GenHlth",
     "direction": "raises",
     "shap": 0.6287522687696995,
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "DiffWalk",
     "direction": "raises",
     "shap": 0.5942636002540899,
     "text_key": "factor.DiffWalk.raises",
     "text": "Difficulty walking or climbing stairs made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "raises",
     "shap": 0.38172306256045674,
     "text_key": "factor.Age.raises",
     "text": "Your age group made your answers more similar to people who have been told they have this condition."
    }
   ]
  }
 },
 "shared_factors": [
  {
   "feature": "GenHlth",
   "diseases": {
    "diabetes": "raises",
    "heart": "raises",
    "stroke": "raises"
   }
  },
  {
   "feature": "HighBP",
   "diseases": {
    "diabetes": "raises",
    "heart": "raises"
   }
  },
  {
   "feature": "Age",
   "diseases": {
    "heart": "raises",
    "stroke": "raises"
   }
  }
 ],
 "notes": [],
 "guidance": [
  "bmi_obese",
  "physical_activity",
  "tobacco",
  "blood_pressure",
  "cholesterol",
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "see_doctor_soon",
 "queue_reasons": [
  "high_band"
 ]
}
```

## (c) Abstained — patient view

Input: `{"age": 52, "sex": "male", "height_cm": 162, "weight_kg": 80, "high_bp": true, "high_chol": false, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 3, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": false}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 30.5,
 "results": {
  "diabetes": {
   "band": null,
   "abstained": true,
   "abstain_reason": "conformal_uncertain",
   "top_factors": []
  },
  "heart": {
   "band": "low",
   "abstained": false,
   "abstain_reason": null,
   "top_factors": [
    {
     "feature": "HighChol",
     "direction": "lowers",
     "text_key": "factor.HighChol.lowers",
     "text": "Having been told your cholesterol is high made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "lowers",
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": null,
   "abstained": true,
   "abstain_reason": "conformal_uncertain",
   "top_factors": []
  }
 },
 "shared_factors": [],
 "notes": [],
 "guidance": [
  "bmi_obese",
  "physical_activity",
  "tobacco",
  "blood_pressure",
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "not_confident"
}
```

## (c) Abstained — clinician view

Input: `{"age": 52, "sex": "male", "height_cm": 162, "weight_kg": 80, "high_bp": true, "high_chol": false, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 3, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": false}`

```json
{
 "emergency": false,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 30.5,
 "results": {
  "diabetes": {
   "band": "moderate",
   "probability": 0.1246,
   "abstained": true,
   "abstain_reason": "conformal_uncertain",
   "conformal_set": [
    0,
    1
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "HighBP",
     "direction": "raises",
     "shap": 0.5561512369599578,
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "raises",
     "shap": 0.4258552650135304,
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "HighChol",
     "direction": "lowers",
     "shap": -0.3536833078317506,
     "text_key": "factor.HighChol.lowers",
     "text": "Having been told your cholesterol is high made your answers less similar to people who have been told they have this condition."
    }
   ]
  },
  "heart": {
   "band": "low",
   "probability": 0.0347,
   "abstained": false,
   "abstain_reason": null,
   "conformal_set": [
    0
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "HighChol",
     "direction": "lowers",
     "shap": -0.4773565079867764,
     "text_key": "factor.HighChol.lowers",
     "text": "Having been told your cholesterol is high made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "lowers",
     "shap": -0.46540954884908664,
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "HighBP",
     "direction": "raises",
     "shap": 0.43625587667860277,
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    }
   ]
  },
  "stroke": {
   "band": "low",
   "probability": 0.0215,
   "abstained": true,
   "abstain_reason": "conformal_uncertain",
   "conformal_set": [
    0,
    1
   ],
   "sex_used": null,
   "top_factors": [
    {
     "feature": "HighBP",
     "direction": "raises",
     "shap": 0.33300157502421,
     "text_key": "factor.HighBP.raises",
     "text": "Having been told you have high blood pressure made your answers more similar to people who have been told they have this condition."
    },
    {
     "feature": "Age",
     "direction": "lowers",
     "shap": -0.22740941833086703,
     "text_key": "factor.Age.lowers",
     "text": "Your age group made your answers less similar to people who have been told they have this condition."
    },
    {
     "feature": "GenHlth",
     "direction": "raises",
     "shap": 0.17641248242441906,
     "text_key": "factor.GenHlth.raises",
     "text": "How you rated your general health made your answers more similar to people who have been told they have this condition."
    }
   ]
  }
 },
 "shared_factors": [],
 "notes": [],
 "guidance": [
  "bmi_obese",
  "physical_activity",
  "tobacco",
  "blood_pressure",
  "regular_checkups"
 ],
 "model_versions": {
  "diabetes": {
   "version": "diabetes-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "heart": {
   "version": "heart-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "lightgbm"
  },
  "stroke": {
   "version": "stroke-v1.0.0",
   "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
   "model": "logreg"
  }
 },
 "next_step": "not_confident",
 "queue_reasons": [
  "abstained"
 ]
}
```

## (d) Emergency — patient view

Input: `{"age": 68, "sex": "male", "height_cm": 162, "weight_kg": 88, "high_bp": true, "high_chol": true, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 4, "ment_health_days": 0, "phys_health_days": 15, "diff_walk": true, "symptoms": {"chest_pain": true}}`

```json
{
 "emergency": true,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 33.5,
 "results": {},
 "shared_factors": [],
 "notes": [],
 "guidance": [],
 "model_versions": {},
 "next_step": "emergency"
}
```

## (d) Emergency — clinician view

Input: `{"age": 68, "sex": "male", "height_cm": 162, "weight_kg": 88, "high_bp": true, "high_chol": true, "smoker": true, "phys_activity": false, "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 4, "ment_health_days": 0, "phys_health_days": 15, "diff_walk": true, "symptoms": {"chest_pain": true}}`

```json
{
 "emergency": true,
 "data_quality": {
  "passed": true,
  "errors": [],
  "warnings": []
 },
 "bmi": 33.5,
 "results": {},
 "shared_factors": [],
 "notes": [],
 "guidance": [],
 "model_versions": {},
 "next_step": "emergency",
 "queue_reasons": [
  "emergency"
 ]
}
```
