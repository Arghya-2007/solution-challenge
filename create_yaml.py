import os

def env_to_yaml(env_path, yaml_path):
    if not os.path.exists(env_path):
        return
    with open(env_path, 'r') as f:
        lines = f.read().splitlines()
    out = []
    for line in lines:
        if "=" in line:
            k, v = line.split("=", 1)
            v = v.strip('"').strip("'")
            out.append(f'{k}: "{v}"')
    with open(yaml_path, 'w') as f:
        f.write("\n".join(out))

env_to_yaml("E:/SC-v2/processing-server/.env", "E:/SC-v2/processing-server/env.yaml")
env_to_yaml("E:/SC-v2/nest-backend/.env", "E:/SC-v2/nest-backend/env.yaml")
