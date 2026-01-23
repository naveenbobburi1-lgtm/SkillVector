import pandas as pd

def load_onet_data():
    occupations = pd.read_csv("data/Occupation Data.txt", sep="\t")
    skills = pd.read_csv("data/Skills.txt", sep="\t")

    return occupations, skills  
