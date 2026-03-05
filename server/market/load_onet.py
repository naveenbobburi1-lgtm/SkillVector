import pandas as pd

def load_onet_data():
    occupations = pd.read_csv("data/Occupation Data.txt", sep="\t")
    skills = pd.read_csv("data/Skills.txt", sep="\t")
    tech_skills = pd.read_csv("data/Technology Skills.txt", sep="\t")
    knowledge = pd.read_csv("data/Knowledge.txt", sep="\t")
    activities = pd.read_csv("data/Work Activities.txt", sep="\t")

    return occupations, skills, tech_skills, knowledge, activities
