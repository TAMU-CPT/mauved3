#!/usr/bin/env python
import sys
import copy
import logging
import argparse
from BCBio import GFF
# from gff3 import feature_lambda, feature_test_type
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def feature_lambda(feature_list, test, test_kwargs, subfeatures=True, parent=None, invert=False, recurse=True):
    # Either the top level set of [features] or the subfeature attribute
    for feature in feature_list:
        feature._parent = parent
        test_result = test(feature, **test_kwargs)
        # if (not invert and test_result) or (invert and not test_result):
        # print feature.type, test_kwargs, test_result, invert ^ test_result
        if invert ^ test_result:
            if not subfeatures:
                feature_copy = copy.deepcopy(feature)
                feature_copy.sub_features = []
                yield feature_copy
            else:
                yield feature

        if recurse and hasattr(feature, 'sub_features'):
            for x in feature_lambda(feature.sub_features, test, test_kwargs, subfeatures=subfeatures, parent=feature, invert=invert, recurse=recurse):
                yield x

def feature_test_type(feature, **kwargs):
    if 'type' in kwargs:
        return feature.type == kwargs['type']
    elif 'types' in kwargs:
        return feature.type in kwargs['types']
    raise Exception("Incorrect feature_test_type call, need type or types")

coloring = {
    'Petty': {
        '13': '#FFFF00',
        '15': '#FFFF00',
        '16': '#FFFF00',
        '17': '#FFFF00',
        '18': '#FFFF00',
        '22': '#FFFF00',
        '23': '#FFFF00',

        '24': '#FFA500',
        '25': '#FFA500',
        '26': '#FFA500',

        '30': '#87CEFA',
        '31': '#87CEFA',
        '32': '#87CEFA',
        '34': '#87CEFA',
        '35': '#87CEFA',
        '36': '#87CEFA',
        '37': '#87CEFA',
        '38': '#87CEFA',
        '39': '#87CEFA',

        '40': '#FF00FF',
        '41': '#FF00FF',

        '42': '#71BC78',
        '43': '#71BC78',
    },
    'Abp1': {
        '20': '#FFFF00',
        '23': '#FFFF00',
        '24': '#FFFF00',
        '25': '#FFFF00',
        '26': '#FFFF00',
        '29': '#FFFF00',
        '30': '#FFFF00',

        '34': '#FFA500',

        '37': '#87CEFA',
        '39': '#87CEFA',
        '42': '#87CEFA',
        '43': '#87CEFA',
        '46': '#87CEFA',

        '52': '#71BC78',
    },
    'phiAB1': {
        '15': '#FFFF00',
        '16': '#FFFF00',
        '17': '#FFFF00',
        '18': '#FFFF00',
        '19': '#FFFF00',
        '20': '#FFFF00',
        '21': '#FFFF00',
        '23': '#FFFF00',
        '24': '#FFFF00',

        '27': '#FFA500',
        '28': '#FFA500',

        '30': '#87CEFA',
        '31': '#87CEFA',
        '32': '#87CEFA',
        '33': '#87CEFA',
        '36': '#87CEFA',
        '37': '#87CEFA',
        '38': '#87CEFA',
        '39': '#87CEFA',
        '40': '#87CEFA',
        '41': '#87CEFA',

        '42': '#FF00FF',
        '43': '#FF00FF',

        '44': '#71BC78',
        '45': '#71BC78',
    },
    'Acibel007': {
        '16': '#FFFF00',
        '18': '#FFFF00',
        '20': '#FFFF00',
        '22': '#FFFF00',
        '26': '#FFFF00',
        '28': '#FFFF00',

        '31': '#FFA500',
        '32': '#FFA500',

        '4': '#87CEFA',
        '5': '#87CEFA',
        '24': '#87CEFA',
        '35': '#87CEFA',
        '36': '#87CEFA',
        '37': '#87CEFA',
        '38': '#87CEFA',
        '41': '#87CEFA',
        '42': '#87CEFA',
        '43': '#87CEFA',
        '44': '#87CEFA',
        '45': '#87CEFA',
        '46': '#87CEFA',

        '47': '#FF00FF',
        '48': '#FF00FF',

        '50': '#71BC78',
        '51': '#71BC78',
    },
    'Fri1': {
        '17': '#FFFF00',
        '21': '#FFFF00',
        '23': '#FFFF00',
        '24': '#FFFF00',
        '25': '#FFFF00',
        '26': '#FFFF00',
        '30': '#FFFF00',
        '31': '#FFFF00',
        '32': '#FFFF00',

        '33': '#FFA500',
        '35': '#FFA500',
        '36': '#FFA500',

        '39': '#87CEFA',
        '40': '#87CEFA',
        '41': '#87CEFA',
        '44': '#87CEFA',
        '45': '#87CEFA',
        '46': '#87CEFA',
        '47': '#87CEFA',
        '48': '#87CEFA',
        '49': '#87CEFA',

        '50': '#FF00FF',
        '51': '#FF00FF',

        '52': '#71BC78',
        '53': '#71BC78',
    },
    'phiAB6': {
        '12': '#FFFF00',
        '13': '#FFFF00',
        '16': '#FFFF00',
        '17': '#FFFF00',
        '19': '#FFFF00',
        '20': '#FFFF00',
        '22': '#FFFF00',
        '23': '#FFFF00',
        '24': '#FFFF00',

        '26': '#FFA500',
        '27': '#FFA500',

        '29': '#87CEFA',
        '30': '#87CEFA',
        '31': '#87CEFA',
        '32': '#87CEFA',
        '35': '#87CEFA',
        '36': '#87CEFA',
        '37': '#87CEFA',
        '38': '#87CEFA',
        '39': '#87CEFA',
        '40': '#87CEFA',

        '41': '#FF00FF',
        '44': '#FF00FF',

        '43': '#71BC78',
        # '44': '#71BC78',
    }
}


def color(gff3):
    for rec in GFF.parse(gff3):
        genes = list(feature_lambda(rec.features, feature_test_type, {'type': 'gene'}, subfeatures=True))
        cdss_sorted = []
        for gene in genes:
            cdss = sorted(list(feature_lambda(gene.sub_features, feature_test_type, {'type': 'CDS'}, subfeatures=True)), key=lambda x: x.location.start)
            for cds in cdss:
                cdss_sorted.append(cds)

        for num, c in enumerate(sorted(cdss_sorted, key=lambda x: x.location.start), 1):
            color = "black"
            if str(num) in coloring[rec.id]:
                color = coloring[rec.id][str(num)]
            c.qualifiers.update({'color': [color]})
            c.qualifiers.update({'num': [num]})
        GFF.write([rec], sys.stdout)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='add color to CDSs')
    parser.add_argument('gff3', type=argparse.FileType("r"), help='GFF3 annotations')
    args = parser.parse_args()
    color(**vars(args))
