import json
import boto3
import os

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    iam = boto3.client('iam')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')

    # ID e região da conta
    account_id = context.invoked_function_arn.split(":")[4]
    region = os.environ.get("AWS_REGION")

    # Nome da conta a partir da variável de ambiente
    account_name = os.environ.get("ACCOUNT_NAME", "Unknown Account")

    # Obter as informações das instâncias
    instances = ec2.describe_instances()
    instance_info = []
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            # Coleta as informações básicas
            instance_id = instance['InstanceId']
            instance_type = instance['InstanceType']
            instance_state = instance['State']['Name']
            
            # Obter nome da instância a partir das tags
            instance_name = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'), "N/A")
            
            # Obter as tags swoMonitor, swoBackup, swoPatch e verificar Start-Stop
            swo_monitor = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoMonitor'), "N/A")
            swo_backup = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoBackup'), "N/A")
            swo_patch = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoPatch'), "N/A")
            start_stop = "Enabled" if any(tag['Key'] in ['Start', 'Shutdown'] for tag in instance.get('Tags', [])) else "Disabled"

            # Obter detalhes específicos da plataforma
            platform_details = instance.get('PlatformDetails', 'Platform Details Not Available')

            # Obter a role associada
            iam_instance_profile = instance.get('IamInstanceProfile')
            instance_role = iam_instance_profile['Arn'].split('/')[-1] if iam_instance_profile else "No Role"
            
            # Obter status SSM e contagem de itens de compliance
            ssm_status = "Not Available"
            critical_non_compliant_count = 0
            security_non_compliant_count = 0
            try:
                # Obter status de conexão do SSM
                ssm_instance_info = ssm.describe_instance_information(
                    Filters=[{'Key': 'InstanceIds', 'Values': [instance_id]}]
                )['InstanceInformationList']
                ssm_status = ssm_instance_info[0]['PingStatus'] if ssm_instance_info else "Not Available"

                # Obter estados dos patches instalados e faltantes
                patch_state = ssm.describe_instance_patch_states(
                    InstanceIds=[instance_id]
                )['InstancePatchStates']

                if patch_state:
                    for patch in patch_state:
                        if patch['CriticalNonCompliantCount']:
                            critical_non_compliant_count = patch['CriticalNonCompliantCount']
                        if patch['SecurityNonCompliantCount']:
                            security_non_compliant_count = patch['SecurityNonCompliantCount']

            except Exception as e:
                print(f"Erro ao obter compliance da instância {instance_id}: {str(e)}")

            # Adiciona os dados coletados ao array
            instance_info.append({
                'InstanceId': instance_id,
                'InstanceName': instance_name,
                'InstanceType': instance_type,
                'State': instance_state,
                'Account': account_name,
                'Region': region,
                'PlatformDetails': platform_details,
                'Role': instance_role,
                'SSMStatus': ssm_status,
                'CriticalNonCompliantCount': critical_non_compliant_count,
                'SecurityNonCompliantCount': security_non_compliant_count,
                'swoMonitor': swo_monitor,
                'swoBackup': swo_backup,
                'swoPatch': swo_patch,
                'StartStop': start_stop
            })

    # Estrutura de dados por conta e região
    account_data = {
        'AccountId': account_id,
        'AccountName': account_name,
        'Region': region,
        'Instances': instance_info
    }

    # Salvar as informações no bucket S3
    bucket_name = os.environ.get("BUCKET_NAME")
    file_name = f'instance-info-{account_id}-{region}.json'
    s3.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=json.dumps(account_data),
        ContentType='application/json'
    )

    return {
        'statusCode': 200,
        'body': json.dumps(f'Informações das instâncias EC2 enviadas para o S3 para a conta {account_id} na região {region}.')
    }
