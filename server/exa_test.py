from exa_py import Exa 

base_url = "https://api.exa.ai/"

exa= Exa(api_key="e1955889-9db5-472b-a822-e38c986f8079")

results = exa.answer(
    "What is the latest valutation of Tesla stock?",
)

print(results.answer)
